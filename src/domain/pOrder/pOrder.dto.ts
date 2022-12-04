export class OrderCreateDto {
  products: {
    productId: number;
    count: number;
  }[];
}
