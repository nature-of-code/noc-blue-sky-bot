import bsky from '@atproto/api';
import * as dotenv from 'dotenv';
import { createCanvas } from 'canvas';
import * as fs from 'fs';

import { noise, noiseSeed, noiseDetail, random, randomSeed, lerpColor, nf } from './math.js';

const { BskyAgent } = bsky;
const agent = new BskyAgent({
  service: 'https://bsky.social',
});
dotenv.config();

const raw = fs.readFileSync('seed.json', 'utf-8');
const json = JSON.parse(raw);
let seed = parseInt(json.seed);

start();

async function start() {
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME,
    password: process.env.BLUESKY_PASSWORD,
  });
  await goSkeet();
  // setInterval(skeet, 1000 * 60 * 4);
}

async function goSkeet() {
  noiseSeed(seed);
  randomSeed(seed);
  // prime the pump
  for (let i = 0; i < 100; i++) {
    random(0, 1);
  }
  let falloff = random(0, 1);
  let octaves = Math.floor(random(1, 16));
  console.log(octaves, falloff);
  noiseDetail(octaves, falloff);
  let { increment, clouds, img } = await blueSky();
  const txt = `seed:  ${nf(seed, 6)}\noctaves: ${octaves}\nfalloff: ${nf(falloff, 1, 2)}\nincrement: ${nf(
    increment,
    1,
    2
  )}\nintensity: ${nf(clouds, 1, 2)}`;
  console.log(txt);
  await skeet(txt, img, 'A cloudly blue sky generated with perlin noise.');
  seed = seed + 1;
  const output = JSON.stringify({ seed });
  fs.writeFileSync('seed.json', output);
}

async function skeet(content, img, altText) {
  const skeet = {
    text: content,
  };
  if (img) {
    skeet.embed = {
      $type: 'app.bsky.embed.images',
      images: [
        {
          image: img.data.blob,
          alt: altText,
        },
      ],
    };
  }
  const response = await agent.post(skeet);
  console.log(response);
}

async function blueSky() {
  const [width, height] = [1280, 720];
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(width, height);

  let xoff = 0;

  const increment = random(0, 0.025);
  const clouds = random(0, 2);
  console.log(increment, clouds);

  for (let x = 0; x < width; x++) {
    let yoff = 0;
    for (let y = 0; y < height; y++) {
      const i = (x + y * width) * 4;
      const n = noise(xoff, yoff);
      const baseColor = lerpColor([21, 122, 188], [102, 185, 240], y / height);
      const cloudColor = [255, 255, 255];
      const finalColor = lerpColor(baseColor, cloudColor, n * clouds);
      const index = (x + y * width) * 4;
      image.data[index] = finalColor[0];
      image.data[index + 1] = finalColor[1];
      image.data[index + 2] = finalColor[2];
      image.data[index + 3] = 255;
      yoff += increment;
    }
    xoff += increment;
  }
  ctx.putImageData(image, 0, 0);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('noise.png', buffer);

  const img = await agent.uploadBlob(buffer, {
    encoding: 'image/png',
  });

  return { img, increment, clouds };
}
