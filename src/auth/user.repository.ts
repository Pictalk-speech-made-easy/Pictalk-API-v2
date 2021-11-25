import { EntityRepository, Repository } from "typeorm";
import { ConflictException, InternalServerErrorException } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { AuthCredentialsDto } from "./dto/auth-credentials.dto";
import { User } from "src/entities/user.entity";
import { Collection } from "src/entities/collection.entity";
import { Picto } from "src/entities/picto.entity";

@EntityRepository(User)
export class UserRepository extends Repository<User> {
    async signUp(authCredentialsDto : AuthCredentialsDto): Promise<User> {
        const {username, password} = authCredentialsDto;

        const user = new User();
        user.username = username;
        user.salt= await bcrypt.genSalt();
        user.password = await this.hashPassword(password, user.salt);
        try {
            await user.save();
        } catch(error){
            if(error.code === '23505'){ // duplicate user name
                throw new ConflictException('Username already exists');
            }
            else {
                throw new InternalServerErrorException(error);
            }
        }
        return user;
    }

    async validateUserPassword(authCredentialsDto: AuthCredentialsDto): Promise<string> {
        const {username, password} = authCredentialsDto;
        const user = await this.findOne({ username });

        if(user && await user.validatePassword(password)){
            return user.username;
        }
        else{
            return null;
        }
    }

    private async hashPassword(password: string, salt: string): Promise<string>{
        return bcrypt.hash(password, salt);
    }

    async getRoot(user: User): Promise<Collection>{
        return user.root;
    }

    async getAllPictos(user: User): Promise<Picto[]>{
        return user.pictos;
    }

    async getAllCollections(user: User): Promise<Collection[]>{
        return user.collections;
    }
}