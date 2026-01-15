module.exports = {
  theme: {
    extend: {},
    screens: {
      xxxs: { max: "330px" }, // Extra extra extra small screens (max-width: 424px)
      xxs: { max: "425px" }, // Extra extra small screens (max-width: 329px)
      xs: { max: "calc(640px + 5rem)" }, // Extra small screens (max-width: 479px)
      sm: { max: "calc(768px + 5rem)" }, // Small screens (max-width: 639px)
      md: { max: "calc(1024px + 5rem)" }, // Medium screens (max-width: 767px)
      lg: { max: "calc(1280px + 5rem)" }, // Large screens (max-width: 1023px)
      xl: { max: "calc(1536px + 5rem)" }, // Extra large screens (max-width: 1279px)
      "2xl": { max: "calc(1537px + 5rem)" }, // 2XL screens (max-width: 1535px)
    },
  },
  plugins: [],
};

// $breakpoints: (
//   orange: calc(1536px + 5rem),
//   yellow: calc(1280px + 5rem),
//   green: calc(1024px + 5rem),
//   blue: calc(768px + 5rem),
//   purple: calc(640px + 5rem),
//   brown: 425px,
//   gray: 330px,
// );
