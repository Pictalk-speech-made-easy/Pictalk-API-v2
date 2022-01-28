export class Notif{
    type: string;
    operation: string;
    affected : string;
    username : string;

    constructor(type: string, operation: string, affected : string, username : string){
        this.type = type;
        this.operation = operation;
        this.affected = affected;
        this.username = username;
    }
}