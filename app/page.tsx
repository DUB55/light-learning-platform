import fs from "fs";
import path from "path";
import { HomePageClient } from "@/components/HomePageClient";

async function getContentFiles() {
  const contentDir = path.join(process.cwd(), "content");
  const files = fs.readdirSync(contentDir);
  const jsonFiles = files.filter(file => file.endsWith(".json"));
  
  const contentData = [];
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(contentDir, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(fileContent);
      const pageName = file.replace(".json", "");
      
      contentData.push({
        pageName,
        title: data.siteMetadata?.title || pageName,
        description: data.siteMetadata?.description || "Study guide"
      });
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }
  
  return contentData.sort((a, b) =>
    a.title.localeCompare(b.title, "nl", { sensitivity: "base" })
  );
}

export default async function Home() {
  const contentFiles = await getContentFiles();
  
  return <HomePageClient contentFiles={contentFiles} />;
}
