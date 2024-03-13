export class Validation {
  username: string;
  validationToken: string;

  constructor(username: string, validationToken: string) {
    this.username = username;
    this.validationToken = validationToken;
  }
}
