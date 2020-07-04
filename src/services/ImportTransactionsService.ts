import fs from 'fs';
import csvParse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const contactsReadStream = fs.createReadStream(filePath);

    const parses = csvParse({
      from_line: 2,
    });
    const parseCSV = contactsReadStream.pipe(parses);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitle = existentCategories.map(
      (category: Category) => {
        return category.title;
      },
    );

    const addCategoryTitle = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitle.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTranslations = transactionsRepository.create(
      transactions.map(({ title, type, value, category }) => ({
        title,
        type,
        value,
        category: finalCategories.find(cat => cat.title === category),
      })),
    );

    await transactionsRepository.save(createdTranslations);

    await fs.promises.unlink(filePath);

    return createdTranslations;
  }
}

export default ImportTransactionsService;
