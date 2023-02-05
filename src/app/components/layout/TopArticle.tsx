import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserMap } from 'service/type';
import { CallWorker } from 'service/worker/callWorker';
import { ArticleTrendsItem } from './msg/Content';

export const TopArticle = ({
  worker,
  userMap,
}: {
  worker?: CallWorker;
  userMap: UserMap;
}) => {
  const { t } = useTranslation();
  const articles = [
    {
      pk: '45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a',
      createdAt: 1674318326,
      title: 'Flycat, a web client with blogging on Nostr',
      url: '/article/45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a/45832',
      blogName: '饮冰室',
    },
    {
      pk: '45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a',
      createdAt: 1674318326,
      title: '飞猫开发记录：一个 Nostr 博客平台',
      url: '/article/45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a/47394',
      blogName: '饮冰室',
    },
    {
      pk: '45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a',
      createdAt: 1674318326,
      title: '小满观后感',
      url: '/article/45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a/8369',
      blogName: '饮冰室',
    },
    {
      pk: '45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a',
      createdAt: 1674318326,
      title: '加密无政府主义简介',
      url: '/article/45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a/9310',
      blogName: '饮冰室',
    },
    {
      pk: '45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a',
      createdAt: 1674318326,
      title: '一座大厦的全球化',
      url: '/article/45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a/6891',
      blogName: '饮冰室',
    },
    {
      pk: '45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a',
      createdAt: 1673622316,
      title: '无法直面的人生',
      url: '/article/45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a/15644',
      blogName: '饮冰室',
    },
    {
      pk: '45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a',
      createdAt: 1674318326,
      title: '沉默的动物',
      url: '/article/45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a/57744',
      blogName: '饮冰室',
    },
    /*
	{
		pk: "47b3b0bd7af5af00783033e4bbcf0e59378b4b1fd13df0065d9101259a7877c7",
		createdAt: 1674185158,
		title: "Bitcoin - A Peer-to-Peer Electronic Cash System",
		url: "/article/47b3b0bd7af5af00783033e4bbcf0e59378b4b1fd13df0065d9101259a7877c7/42268",
		blogName: "BTC"
	}
	*/
  ];

  return (
    <div
      style={{ background: '#F6F9F9', padding: '10px', borderRadius: '5px' }}
    >
      <div
        style={{
          fontSize: '20px',
          fontWeight: '600',
          margin: '0px 10px 20px 5px',
        }}
      >
        {t('topArticle.title')}
      </div>
      {articles.map(a => (
        <ArticleTrendsItem
          shareUrl={a.url}
          avatar={userMap.get(a.pk)?.picture}
          title={a.title}
          blogName={a.blogName}
          createdAt={a.createdAt}
          author={userMap.get(a.pk)?.name}
        />
      ))}
    </div>
  );
};
