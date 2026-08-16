export interface IPaymobIntentionResponse {
    id: string;
    client_secret: string;
    amount: number;
    currency: string;
    status: string;
}