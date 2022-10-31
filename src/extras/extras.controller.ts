
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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
function getDate(){
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth()+1
  const days = getDaysInMonth(year, month);
  const column = encodeURIComponent(':')
  const plus = encodeURIComponent('+')
  return `&from=${year}-${month}-01T00${column}00${column}00${plus}02${column}00&to=${year}-${month}-${days}T23${column}59${column}59${plus}01${column}00`;
}
class Report {
  amount: string;
  donators: string[];
  fill(response: any){
    this.amount = ((response.availableAmount - response.debitAmount)/100).toString();
  }
  fillDonators(donations: object[]){
    var names: string[]=[]
    donations.sort(function(a: object, b: object) {
      const amoutA: number = a['items'][0]['amount']
      const amoutB: number = b['items'][0]['amount']
      if (amoutA < amoutB) return 1;
      if (amoutA > amoutB) return -1;
    })
    for(let donation of donations){
      names.push(donation['payer']['firstName']);
    }
    this.donators = names;
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
  private donators_url = process.env.ASSO_DONATORS_URL;
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
      const response_amount = await fetch(this.report_url, {method: 'GET', headers: myHeaders})
      if(response_amount.status == 200){
        const data = await response_amount.json();
        report.fill(data);
      } else {
        throw new InternalServerErrorException('external server did not serve amount');
      }
      const date = getDate();
      const response_donators = await fetch(this.donators_url+"&pageSize=40"+date, {method: 'GET', headers: myHeaders})
      if(response_donators.status == 200){
        const data: object[] = (await response_donators.json()).data;
        report.fillDonators(data);
      } else {
        throw new InternalServerErrorException('external server did not serve donators');
      }
      if(response_amount.status == 200 && response_donators.status == 200){
        renew = false;
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