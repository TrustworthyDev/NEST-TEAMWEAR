import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({}),
      dataSourceFactory: async () => {
        const { default: datasource } = await import('./dataSource');
        await datasource.initialize();
        return datasource;
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
