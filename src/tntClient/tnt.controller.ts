import {
  Controller,
  Get,
  Query,
  Res,
  ParseArrayPipe,
  Header,
} from '@nestjs/common';
import { TntService } from './tnt.service';

@Controller('tnt')
export class TntController {
  constructor(private readonly tntService: TntService) {}

  @Get('manifest')
  async getTNTManifest(
    @Res() res,
    @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
    ids: number[],
  ) {
    try {
      const stream = await this.tntService.generateTNTManifest(ids);
      res.set('Content-Type', 'application/pdf');
      res.attachment('manifest.pdf');
      res.status(200);
      stream.pipe(res);
    } catch (err) {
      res.set('Content-Type', 'application/json');
      res.status(err.status);
      res.json(err.getResponse());
    }
  }
}
