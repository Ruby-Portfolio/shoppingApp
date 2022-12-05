## 개요
- 쇼핑몰 서비스 구현

## 사용 기술
- TypeScript, NestJS, MySQL, Redis

## 패키지
<details>
    <summary>공통</summary>

  - npm i @nestjs/config
</details>
<details>
    <summary>DB</summary>

- npm install mysql2
- npm i typeorm
- npm i @nestjs/typeorm
</details>
<details>
    <summary>Cache</summary>

- npm i cache-manager
- npm i @types/cache-manager
- npm i cache-manager-ioredis
</details>
<details>
    <summary>Validator</summary>

- npm i class-validator
- npm i @nestjs/class-validator
- npm i class-transformer
</details>
<details>
    <summary>사용자 인증</summary>

- npm i passport
- npm i @nestjs/passport
- npm i passport-google-oauth20
- npm i passport-jwt
- npm i @nestjs/jwt
- npm i cookie-parser
- npm i @types/cookie-parser
</details>

## 요구사항
- 사용자 인증
  - 사용자는 OAuth2 인증을 통해 인증 및 서비스를 이용할 수 있다.
- 마켓
  - 사용자는 자신의 마켓을 생성할 수 있다.
  - 사용자는 생성한 마켓 정보를 수정할 수 있다.
  - 사용자는 생성한 마켓 정보를 삭제할 수 있다.
- 상품
  - 마켓에 상품을 등록할 수 있다.
  - 등록한 상품 정보를 수정할 수 있다.
  - 등록한 상품 정보를 삭제할 수 있다.
  - 등록한 상품 및 상품 목록을 조회할 수 있다.
- 주문
  - 등록된 상품들을 주문할 수 있다.
  - 등록한 주문을 취소할 수 있다.
  - 사용자는 자신의 주문 목록을 조회할 수 있다.

## ER Diagram
![img.png](img/er-diagram.png)
