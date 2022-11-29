import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { OAuth2User } from "./auth.dto";
import { Payload } from "./jwt/jwt.payload";
import { AuthGuard } from "@nestjs/passport";
import { JwtService } from "@nestjs/jwt";

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() { user }, @Res() res) {
    const oAuthUser = await this.authService.authLogin(user as OAuth2User);

    const token = this.jwtService.sign({ ...oAuthUser } as Payload);

    res.cookie('Authentication', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 30,
    });

    return res.redirect('/');
  }
}
