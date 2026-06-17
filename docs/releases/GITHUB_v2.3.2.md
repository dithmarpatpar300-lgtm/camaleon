## Summary

- **Transmutation defaults (Settings S2)** — global JPEG quality, PNG compression, AVIF quality/speed, alpha background
- Defaults apply when a tool loads; per-session sliders still override

## Test plan

- [ ] Set JPEG quality 70 in Settings; open PNG→JPG — slider starts at 70
- [ ] Set black alpha background; open WebP→JPG — flatten uses black
- [ ] Reset to factory restores registry baselines
- [ ] `npm run test:defaults`
