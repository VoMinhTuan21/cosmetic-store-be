import { HttpException } from '@nestjs/common';

export function handleResponseSuccess<T>({
  data,
  message,
}: {
  data: T;
  message: string;
}) {
  return {
    data,
    message,
  };
}

export function handleResponseFailure({
  error,
  statusCode,
}: {
  error: string;
  statusCode: number;
}) {
  throw new HttpException({ error, statusCode }, statusCode);
}
