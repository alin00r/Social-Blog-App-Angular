import { User } from './user.model';

export interface ArticleImage {
  url: string;
  id: string;
  _id: string;
}

export interface Article {
  _id: string;
  title: string;
  content: string;
  images?: ArticleImage[];
  author?: string | User;
  group: { _id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}
