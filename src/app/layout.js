import "./globals.css";

export const metadata = {
  title: "CV Suite - Image Processing Lab",
  description: "Web-based Image Processing Suite",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
