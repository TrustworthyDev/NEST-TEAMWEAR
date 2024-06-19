import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShippingClient } from './shipping-client';

@Module({
  imports: [ConfigModule],
  providers: [ShippingClient],
  exports: [ShippingClient],
})
export class ShippingClientModule {}
