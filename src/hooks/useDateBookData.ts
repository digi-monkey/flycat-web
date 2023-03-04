import { useEffect, useState } from 'react';
import { Article } from 'service/nip/23';

export interface BookMetadata {
  title: string;
  count: number;
  time: number;
}

export function useDateBookData(articles: Article[]) {
  const [books, setBooks] = useState<BookMetadata[]>([]);
  useEffect(() => {
    const timeStamps = articles.map(a => {
      if (a.published_at) {
        return a.published_at;
      }
      return a.updated_at;
    });
    const dates = groupTimestampsByYearMonth(timeStamps);
    const books = articles
      .map(a => {
        const yearMonth = Object.keys(dates).filter(d =>
          dates[d].includes(a.published_at || a.updated_at),
        )[0];
        const timestampArticles = articles.filter(a =>
          dates[yearMonth].includes(a.published_at || a.updated_at),
        );
        return {
          title: yearMonth,
          count: timestampArticles.length,
          time:
            timestampArticles[0].published_at ||
            timestampArticles[0].updated_at,
        };
      })
      // remove duplicated
      .reduce(
        (
          unique: {
            title: string;
            count: number;
            time: number;
          }[],
          data: {
            title: string;
            count: number;
            time: number;
          },
        ) => {
          if (!unique.some(item => item.title === data.title)) {
            unique.push(data);
          }
          return unique;
        },
        [],
      );
    setBooks(books);
  }, [articles]);
  return books;
}

export interface GroupedTimestamps {
  [yearMonth: string]: number[];
}

export function groupTimestampsByYearMonth(
  timestamps: number[],
): GroupedTimestamps {
  const grouped: GroupedTimestamps = {};

  timestamps.forEach(timestamp => {
    const date = new Date(timestamp * 1000); // Convert timestamp to Date object
    const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`; // Get year and month as string (e.g. "2022-1")

    if (grouped[yearMonth]) {
      grouped[yearMonth].push(timestamp); // Add timestamp to existing array
    } else {
      grouped[yearMonth] = [timestamp]; // Create new array with timestamp
    }
  });

  return grouped;
}

export function isTimestampInYearMonth(
  timestamp: number,
  yearMonth: string,
): boolean {
  const date = new Date(timestamp * 1000); // Convert timestamp to Date object
  const timestampYearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`; // Get year and month as string (e.g. "2022-1")

  return timestampYearMonth === yearMonth;
}

export function getDateBookName(timestamp: number) {
  const date = new Date(timestamp * 1000); // Convert timestamp to Date object
  const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`; // Get year and month as string (e.g. "2022-1")
  return yearMonth;
}
