import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { AuthCredentialsDto } from "src/auth/dto/auth-credentials.dto";
import { UserRepository } from "src/auth/user.repository";
import { Collection } from "src/entities/collection.entity";
import { User } from "src/entities/user.entity";

@Injectable()
export class UtilitiesService{
    constructor(
        @Inject(forwardRef(() => UserRepository))
        private userRepository : UserRepository,
    ) {}
    async createUser(authCredentialsDto : AuthCredentialsDto): Promise<Collection>{
        const user = await this.userRepository.signUp(authCredentialsDto);
        const collection = this.createRoot(user);
        return collection;
    }

    async createRoot(user : User):Promise<Collection>{
        let collection = new Collection();
        collection.meaning = '';
        collection.userId = user.id;
        user.root = collection.id;
        return collection;
    }
}