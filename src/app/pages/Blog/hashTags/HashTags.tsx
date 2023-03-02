import React, { useEffect, useState } from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import './style.css';

const suggestions = [
  'flycat',
  'nostr',
  'crypto',
  'lighting',
  'bitcoin',
  'zap',
  'develop',
  'nip',
  'blockchain',
  'satoshi',
].map(tag => {
  return {
    id: tag,
    text: tag,
  };
});

const KeyCodes = {
  comma: 188,
  enter: 13,
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

export interface TagObj {
  id: string;
  text: string;
}

export interface HashTagsProp {
  predefineTags?: TagObj[];
  callback: (tags: TagObj[]) => any;
}
export const HashTags = ({ predefineTags, callback }: HashTagsProp) => {
  const [tags, setTags] = useState<TagObj[]>([]);

  useEffect(() => {
    if (predefineTags == null || predefineTags.length === 0) return;

    setTags(predefineTags);
  }, [predefineTags]);

  useEffect(() => {
    callback(tags);
  }, [tags]);

  const handleDelete = i => {
    setTags(tags.filter((tag, index) => index !== i));
  };

  const handleAddition = tag => {
    setTags([...tags, tag]);
  };

  const handleDrag = (tag, currPos, newPos) => {
    const newTags = tags.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    // re-render
    setTags(newTags);
  };

  const handleTagClick = index => {
    console.log('The tag at index ' + index + ' was clicked');
  };

  return (
    <ReactTags
      inputFieldPosition="bottom"
      tags={tags}
      suggestions={suggestions}
      delimiters={delimiters}
      handleDelete={handleDelete}
      handleAddition={handleAddition}
      handleDrag={handleDrag}
      handleTagClick={handleTagClick}
      allowUnique={true}
      allowDragDrop={true}
      autocomplete
      autofocus={false}
    />
  );
};
