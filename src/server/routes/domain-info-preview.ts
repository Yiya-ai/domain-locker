import { defineEventHandler } from 'h3';
import { requireExternalQueries } from '../utils/external-queries';

export default defineEventHandler(requireExternalQueries);
