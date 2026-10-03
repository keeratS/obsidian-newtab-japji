// Copyright (c) 2026 Keerat Singh
// SPDX-License-Identifier: GPL-3.0-only
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({resolve:{alias:{obsidian:fileURLToPath(new URL('./tests/obsidian-stub.ts',import.meta.url))}}});
