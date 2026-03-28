// @/core/nooCloud

export type { ApiResponse } from './core';


import { Auth } from './auth';
import { Store } from './store';
import { User } from './user';
import { AI } from './ai';
import { Media } from './media';
import { Note } from './note'
import { Core } from './core'


export const nooCloud = {
  ai: AI,
  auth: Auth,
  media: Media,
  note: Note,
  store: Store,
  user: User,
  core:Core,
};


// 向后兼容的云服务实例
export default nooCloud;