import React from 'react';
import { Article } from 'service/nip/23';
import { Book } from './Book';
import { useDateBookData } from 'hooks/useDateBookData';

export function DateBook({ articles }: { articles: Article[] }) {
  const books = useDateBookData(articles);
  return (
    <span>
      {books.map(book => (
        <span style={{ paddingRight: '20px' }}>
          <Book title={book.title} count={book.count} time={book.time} />
        </span>
      ))}
    </span>
  );
}
