import { Controller, Post, Put, Body, Param, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { Headers, HttpException, HttpStatus } from '@nestjs/common';

@Controller() // Base path for the controller
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Route for verifying a user
  @Post('verifyUser')
  async verifyUser(@Body() data: any) {
    return this.userService.verifyUser(data);
  }

  // Route for registering a user
  @Post('registerUser')
  async registerUser(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization token is missing or malformed');
    }
    return this.userService.registerUser(authHeader);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.userService.loginUser(body.email, body.password);
  }

  @Put('reset-password')
  async resetPassword(
    @Headers('authorization') token: string,
    @Query('newPassword') newPassword: string,
  ) {
    return this.userService.resetPassword(token, newPassword);
  }

  @Post('forgetPassword')
  async forgotPassword(@Query() body: { email: string }) {
    return this.userService.forgotPassword(body.email);
  }

  @Get('userDetails')
  async getUserDetails(@Headers('authorization') authHeader: string) {
    // Check if the authorization header exists and is in correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authorization token is missing or malformed',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.split(' ')[1]; // Extract token from header

    // Pass the token to the service method
    return this.userService.getUserDetails(token);
  }
}
