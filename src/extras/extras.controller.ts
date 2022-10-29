
import { Get, InternalServerErrorException, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Controller } from "@nestjs/common/decorators/core/controller.decorator";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "src/auth/auth.service";
import { GetUser } from "src/auth/get-user.decorator";
import { CollectionService } from "src/collection/collection.service";
import { User } from "src/entities/user.entity";
import { PictoService } from "src/picto/picto.service";

class DBReport {
  userNb: number;
  pictogramNb: number;
  collectionNb: number;
  imageSize: number;
}

class Report {
  amount: string;
  debitAmount : string;
  protectedAmount : string;
  fill(response: any){
    this.amount = response.availableAmount;
    this.debitAmount = response.debitAmount;
    this.protectedAmount = response.protectedAmount;
  }
}
const report: Report = new Report();

var token: string;
async function refreshToken(urlBody: any): Promise<void>{
  const body = {password: urlBody.pwd, username: urlBody.log}
  fetch(urlBody.url, {
    method: 'POST',
    headers: {
    'Accept': '*/*',
    'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  .then(async (response)=>{
    if(response.status == 200){
      const data = await response.json().then((data)=> {return data});
      token = data.access_token;
      setTimeout(function(){
        refreshToken(urlBody);
      } ,(data.expires_in - 10)*1000);
    }
  });
  return;
}

var renew: boolean = true;
setInterval(function(){renew = true;}, 15*1000);

@Controller('extras')
export class ExtrasController {
  private auth_url = process.env.ASSO_AUTH_URL;
  private report_url = process.env.ASSO_REPORT_URL;
  private pwd = process.env.ASSO_PWD;
  private log = process.env.ASSO_LOG;
  constructor(private collectionService: CollectionService, private authService: AuthService, private pictoService: PictoService){
    refreshToken({url: this.auth_url, pwd: this.pwd, log: this.log});
  }
  @Get('/amounts')
  async money(): Promise<Report>{
    if(renew){
      const myHeaders = new Headers();
      myHeaders.append('Authorization', 'Bearer '+token);
      const response = await fetch(this.report_url, {method: 'GET', headers: myHeaders})
      if(response.status == 200){
        const data = await response.json();
        report.fill(data);
        renew = false;
      } else {
        throw new InternalServerErrorException('external server did not serve amount');
      }
    }
    return report;
  }

  @Get('/dbsummary')
  @UseGuards(AuthGuard())
  async dbSummary(@GetUser() user: User): Promise<DBReport> {
    if (!user.admin) {
      throw new UnauthorizedException(`User ${user.username} is not admin, only admins can get feedbacks`);
    }
    const dbReport: DBReport = new DBReport();
    dbReport.collectionNb = await this.collectionService.getCollectionCount();
    dbReport.pictogramNb = await this.pictoService.getPictoCount();
    dbReport.userNb = await this.authService.getUserCount();
    dbReport.imageSize = 0;
    return dbReport;
  }
}