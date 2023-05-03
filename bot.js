import bsky from '@atproto/api';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const { BskyAgent } = bsky;
const agent = new BskyAgent({
  service: 'https://bsky.social',
});
dotenv.config();

async function start() {
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME,
    password: process.env.BLUESKY_PASSWORD,
  });

  goTweet();
  setInterval(goTweet, 1000 * 60 * 4);
}

async function goTweet() {
  let s = Math.random();
  console.log(s);
  await post(`${s}`);
}

async function post(content) {
  const response = await agent.post({
    text: content,
  });
  console.log(response);
}

start();
