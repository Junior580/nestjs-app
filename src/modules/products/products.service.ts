import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { ListProductDto } from './dto/list-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

  async create(createProductDto: CreateProductDto) {
    const existingProduct = await this.productRepository.findOne({
      where: { productName: createProductDto.productName },
    });

    if (existingProduct) {
      throw new ConflictException('Product already exists');
    }

    const product = this.productRepository.create(createProductDto);

    await this.productRepository.save(product);

    return product;
  }

  async findAll(listProductDto: ListProductDto) {
    const orderByField = listProductDto.sort ?? 'createdAt';
    const orderByDir = listProductDto.sortDir ?? 'ASC';
    const page = Number(
      listProductDto.page && listProductDto.page > 0 ? listProductDto.page : 1,
    );
    const perPage = Number(
      listProductDto.perPage && listProductDto.perPage > 0
        ? listProductDto.perPage
        : 10,
    );

    const count = await this.productRepository.count();

    const products = await this.productRepository.find({
      where: { productName: listProductDto.filter },
      order: { [orderByField]: orderByDir },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      items: products,
      total: count,
      currentPage: page,
      perPage,
      sort: orderByField,
      sortDir: orderByDir,
      filter: listProductDto.filter ?? null,
    };
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const hasValidField = Object.values(updateProductDto).some(
      (value) => value !== null && value !== undefined && value !== '',
    );

    if (!hasValidField) {
      throw new BadRequestException(
        'At least one field must be required for update',
      );
    }

    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (updateProductDto.productName) {
      const existingProduct = await this.productRepository.findOne({
        where: { productName: updateProductDto.productName },
      });

      if (existingProduct) {
        throw new ConflictException('Product already exists');
      }
    }

    await this.productRepository.update(id, {
      ...updateProductDto,
    });

    return this.productRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productRepository.remove(product);

    return { message: `Product #${id} successfully removed` };
  }
}
