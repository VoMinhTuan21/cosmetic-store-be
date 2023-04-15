declare interface IRevenueValue {
  value: number;
  label: string;
}

declare interface IOrderRevenue {
  _id: string;
  totalPrice: number;
  createdAt: Date;
}

declare interface IOrderOverview {
  _id: string;
  count: number;
}

declare interface IOrderOverviewRes {
  status: string;
  count: number;
}
