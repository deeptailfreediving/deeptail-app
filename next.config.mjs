/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 한 번 연 화면은 잠깐 기억해 두고 탭을 오갈 때 다시 받지 않음
    // (신청·수정 등 변경이 생기면 그 즉시 새로 받음)
    staleTimes: { dynamic: 30, static: 300 },
    // 자격증·후기 사진(휴대폰에서 1MB 이하로 줄여서 보냄)
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
