import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category_id: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category_id,
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

    // Create an instance of Transaction
    const transaction = await transactionsRepository.create({
      title,
      type,
      value,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
