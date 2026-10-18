export interface IPaymobIntentionResponse {
  intention_order_id: string;
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}
