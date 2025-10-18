import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
  credits: number;
}

const templates: Template[] = [
  {
    id: "1",
    name: "YouTube Thumbnail",
    category: "YouTube",
    thumbnail: "https://via.placeholder.com/200x112",
    description: "Professional YouTube thumbnail template",
    credits: 1,
  },
  {
    id: "2",
    name: "Social Media Post",
    category: "Social",
    thumbnail: "https://via.placeholder.com/200x200",
    description: "Instagram & TikTok optimized template",
    credits: 1,
  },
  {
    id: "3",
    name: "Professional Banner",
    category: "Business",
    thumbnail: "https://via.placeholder.com/400x100",
    description: "Corporate banner template",
    credits: 2,
  },
  {
    id: "4",
    name: "Product Showcase",
    category: "E-commerce",
    thumbnail: "https://via.placeholder.com/300x300",
    description: "Product display template",
    credits: 1,
  },
];

export function TemplateLibrary() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Template Library</h2>
        <p className="text-gray-600 mt-2">Choose from professional templates</p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedTemplate(template)}
          >
            <img
              src={template.thumbnail}
              alt={template.name}
              className="w-full h-40 object-cover rounded-t-lg"
            />
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-600">{template.category}</p>
              <p className="text-sm text-gray-700 mt-2">{template.description}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm font-medium text-blue-600">
                  {template.credits} credit{template.credits > 1 ? "s" : ""}
                </span>
                <Button size="sm" variant="outline">
                  Use Template
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {selectedTemplate.name}
              </h3>
              <img
                src={selectedTemplate.thumbnail}
                alt={selectedTemplate.name}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <p className="text-gray-700 mb-6">{selectedTemplate.description}</p>
              <div className="flex gap-4">
                <Button className="flex-1" variant="default">
                  Use This Template
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default TemplateLibrary;
