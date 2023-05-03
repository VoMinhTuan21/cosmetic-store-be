declare interface IButtonFallBack {
  type: 'web_url' | 'postback';
  title: string;
  url?: string;
  payload?: string;
}

declare interface IReply {
  content_type: string;
  title: string;
  payload: string;
}
