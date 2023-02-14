import { HttpException, HttpStatus } from '@nestjs/common';

export const imageFileFilter = (req, file, callback) => {
  // console.log('file: ', file);
  if (
    !file.originalname.match(/\.(jpg|jpeg|png)$/) &&
    !file.mimetype.match(/\/(jpg|jpeg|png)$/)
  ) {
    return callback(
      new HttpException(
        'Only image files are allowed!',
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }
  callback(null, true);
};
