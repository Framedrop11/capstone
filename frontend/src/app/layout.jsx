import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "ClearScore - AI Credit Rehabilitation",
  description: "India's first AI-powered Credit Rehabilitation Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}