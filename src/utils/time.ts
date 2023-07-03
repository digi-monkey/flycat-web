export function formatDate(secs: number): string {
  const date = new Date(secs * 1000); // Convert seconds to milliseconds
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // Add leading zero if necessary
  const day = ('0' + date.getDate()).slice(-2); // Add leading zero if necessary
  const hours = ('0' + date.getHours()).slice(-2); // Add leading zero if necessary
  const minutes = ('0' + date.getMinutes()).slice(-2); // Add leading zero if necessary
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatLongDate(secs: number): string {
  const date = new Date(secs * 1000); // Convert seconds to milliseconds
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

export function calculateReadTime(article: string): string {
  const wordsPerMinute = 200; // Adjust this value based on reading speed
  const wordCount = article.trim().split(/\s+/).length;
  const readTimeMinutes = Math.ceil(wordCount / wordsPerMinute);

  if (readTimeMinutes < 1) {
    return 'Less than a minute';
  } else if (readTimeMinutes === 1) {
    return '1 minute';
  } else if (readTimeMinutes < 60) {
    return `${readTimeMinutes} minutes`;
  } else {
    const readTimeHours = Math.floor(readTimeMinutes / 60);
    const remainingMinutes = readTimeMinutes % 60;
    if (remainingMinutes === 0) {
      return `${readTimeHours} hour${readTimeHours > 1 ? 's' : ''}`;
    } else {
      return `${readTimeHours} hour${
        readTimeHours > 1 ? 's' : ''
      } ${remainingMinutes} minutes`;
    }
  }
}

export function timeSince(timestamp: number) {
  const currentTime = Date.now() / 1000;
  const timeDifference = currentTime - timestamp;

  if (timeDifference < 60) {
    return `${Math.floor(timeDifference)} seconds`;
  } else if (timeDifference < 3600) {
    return `${Math.floor(timeDifference / 60)} minutes}`;
  } else if (timeDifference < 86400) {
    return `${Math.floor(timeDifference / 3600)} hours`;
  } else if (timeDifference < 2592000) {
    return `${Math.floor(timeDifference / 86400)} days`;
  } else {
    return `${Math.floor(timeDifference / 2592000)} month`;
  }
}
