import {
  Body,
  Controller,
  Get,
  Post,
  // Post,
  // Body,
  // Patch,
  // Param,
  // Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { EnvConfigService } from 'src/shared/env-config/env-config.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: EnvConfigService,
  ) {}

  @Get()
  getHello() {
    const env = this.configService.getNodeEnv();
    const port = this.configService.getAppPort();
    const jwt = this.configService.getNodeEnv();
    const dbhost = this.configService.getDatabaseHost();
    const dbport = this.configService.getDatabasePort();
    const dbuser = this.configService.getDatabaseUser();
    const dbpass = this.configService.getDatabasePassword();
    const dbname = this.configService.getDatabaseName();
    return { env, port, jwt, dbhost, dbport, dbuser, dbpass, dbname };
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  //
  // @Get()
  // findAll() {
  //   return this.usersService.findAll();
  // }
  //
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.usersService.findOne(+id);
  // }
  //
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(+id, updateUserDto);
  // }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(+id);
  // }
}
