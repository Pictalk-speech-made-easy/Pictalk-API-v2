import {
  Get,
  InternalServerErrorException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Controller } from '@nestjs/common/decorators/core/controller.decorator';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from 'src/auth/auth.service';
import { GetUser } from 'src/auth/get-user.decorator';
import { UserGuard } from 'src/auth/user.guard';
import { CollectionService } from 'src/collection/collection.service';
import { User } from 'src/entities/user.entity';
import { PictoService } from 'src/picto/picto.service';

class DBReport {
  userNb: number;
  pictogramNb: number;
  collectionNb: number;
  imageSize: number;
}

function getDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const nextMonth = month + 1 > 12 ? 1 : month + 1;
  const prevMonth = month - 1 < 1 ? 12 : month - 1;
  const column = encodeURIComponent(':');
  const plus = encodeURIComponent('+');
  return {
    now: `&from=${year}-${month}-10T00${column}00${column}00${plus}02${column}00&to=${year}-${nextMonth}-10T23${column}59${column}59${plus}01${column}00`,
    past: `&from=${year}-${prevMonth}-10T00${column}00${column}00${plus}02${column}00&to=${year}-${month}-10T23${column}59${column}59${plus}01${column}00`,
  };
}
class Report {
  amount: string;
  pastAmount: string;
  donators: string[];
  pastDonators: string[];

  fillDonatorsAmount(donations: object[], current: boolean) {
    var names: string[] = [];
    let amount: number = 0;
    donations.sort(function (a: object, b: object) {
      const amoutA: number = a['items'][0]['amount'];
      const amoutB: number = b['items'][0]['amount'];
      if (amoutA < amoutB) return 1;
      if (amoutA > amoutB) return -1;
    });
    for (let donation of donations) {
      names.push(donation['payer']['firstName']);
      amount = amount + donation['amount'];
    }
    amount = amount / 100;
    if (current) {
      this.donators = names;
      this.amount = amount.toString();
    } else {
      this.pastDonators = names;
      this.pastAmount = amount.toString();
    }
  }
}
const report: Report = new Report();

var token: string;
async function refreshToken(urlBody: any): Promise<void> {
  const body = new URLSearchParams();
  body.append('client_id', urlBody.client_id);
  body.append('client_secret', urlBody.client_secret);
  body.append('grant_type', 'client_credentials');
  fetch(urlBody.url, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body,
  })
    .then(async (response) => {
      if (response.status == 200) {
        const data = await response.json();
        token = data.access_token;
        setTimeout(function () {
          refreshToken(urlBody);
        }, (data.expires_in - 10) * 1000);
      } else {
        setTimeout(function () {
          refreshToken(urlBody);
        }, 10000);
      }
    })
    .catch((error) => {
      setTimeout(function () {
        refreshToken(urlBody);
      }, 10000);
      console.log(error);
    });
  return;
}

var renew: boolean = true;
setInterval(function () {
  renew = true;
}, 15 * 1000);

@Controller('extras')
export class ExtrasController {
  private auth_url = process.env.ASSO_AUTH_URL;
  private donators_url = process.env.ASSO_DONATORS_URL;
  private client_secret = process.env.ASSO_CLIENT_SECRET;
  private client_id = process.env.ASSO_CLIENT_ID;
  constructor(
    private collectionService: CollectionService,
    private authService: AuthService,
    private pictoService: PictoService,
  ) {
    refreshToken({
      url: this.auth_url,
      client_id: this.client_id,
      client_secret: this.client_secret,
    });
  }
  @Get('/amounts')
  async money(): Promise<Report> {
    if (renew) {
      const myHeaders = new Headers();
      myHeaders.append('Authorization', 'Bearer ' + token);
      const date = getDate().now;
      const pastdate = getDate().past;
      let neterrors = 0;
      fetch(this.donators_url + '&pageSize=40' + date, {
        method: 'GET',
        headers: myHeaders,
      })
        .then(async (response_donators) => {
          if (response_donators.status == 200) {
            const data: object[] = (await response_donators.json()).data;
            report.fillDonatorsAmount(data, true);
          } else {
            neterrors++;
            console.log('external server did not serve donators');
          }
        })
        .catch((error) => {
          console.log(error);
          neterrors++;
        });
      fetch(this.donators_url + '&pageSize=40' + pastdate, {
        method: 'GET',
        headers: myHeaders,
      })
        .then(async (response_past_amount) => {
          if (response_past_amount.status == 200) {
            const data: object[] = (await response_past_amount.json()).data;
            report.fillDonatorsAmount(data, false);
          } else {
            neterrors++;
            console.log('external server did not serve last months donators');
          }
        })
        .catch((error) => {
          neterrors++;
        });
      neterrors > 0 ? (renew = true) : (renew = false);
    }
    return report;
  }

  @UseGuards(UserGuard)
  @Get('/dbsummary')
  async dbSummary(@GetUser() user: User): Promise<DBReport> {
    if (!user.admin) {
      throw new UnauthorizedException(
        `User ${user.username} is not admin, only admins can get feedbacks`,
      );
    }
    const dbReport: DBReport = new DBReport();
    dbReport.collectionNb = await this.collectionService.getCollectionCount();
    dbReport.pictogramNb = await this.pictoService.getPictoCount();
    dbReport.userNb = await this.authService.getUserCount();
    dbReport.imageSize = 0;
    return dbReport;
  }
}
