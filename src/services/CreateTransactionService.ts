import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateCategoryService from './CreateCategoryService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryTitle,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('title must be "income" or "outcome"');
    }

    if (value <= 0) {
      throw new AppError('value must be greater than 0');
    }

    if (
      type === 'outcome' &&
      value > (await transactionsRepository.getBalance().total)
    ) {
      throw new AppError('insufficient funds');
    }
    const createCategory = new CreateCategoryService();
    const category = await createCategory.execute(categoryTitle);

    const transaction = await transactionsRepository.create({
      title,
      type,
      value,
      category,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
