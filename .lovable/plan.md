
## লক্ষ্য

`/app` ড্যাশবোর্ডে এখন যে ২-ট্যাব লেআউট (Curriculum Hub + Practical Lab Room একই পেজে) আছে, সেটাকে রিপ্লেস করে একটা পরিষ্কার **৪-কার্ড হোম** বানানো হবে। প্রতিটা কার্ড একটা সাব-ভিউ খুলবে।

## ৪টা কার্ড

1. **Curriculum Hub** → ক্লিকে এখনকার Curriculum ট্যাবের পুরো কন্টেন্ট (১২ অধ্যায়, চ্যাপ্টার ড্রয়ার, AI Tutor শর্টকাট) দেখাবে।
2. **Practical Lab Room** → ক্লিকে শুধু সেই ল্যাবগুলো দেখাবে **যেগুলো কোনো চ্যাপ্টারে ম্যাপ করা নেই** (সার্চ + ফিল্টার সহ এখনকার লেআউট)।
3. **Video Lessons** → "শীঘ্রই আসছে" কার্ড, ক্লিকে toast।
4. **Smart Notes** → "শীঘ্রই আসছে" কার্ড, ক্লিকে toast।

## চ্যাপ্টার–ল্যাব রি-ম্যাপিং

বর্তমানে ১২টা ল্যাবই কোনো না কোনো চ্যাপ্টারে আছে — ফলে Practical Lab Room খালি হয়ে যাবে। তাই "এক্সপ্লোরেটরি/কনসেপ্টচুয়াল" ল্যাব (যেগুলো `isCoreBoard: false`) চ্যাপ্টার থেকে আনম্যাপ করে শুধু Practical Lab Room-এ দেখানো হবে:

| ল্যাব | আগে | এখন |
|---|---|---|
| `bonding_basics` | Ch 5 | Practical Lab Room |
| `ph_scale` | Ch 10 | Practical Lab Room |
| `indicator_compare` | Ch 10 | Practical Lab Room |
| `solubility_rules` | Ch 9 | Practical Lab Room |