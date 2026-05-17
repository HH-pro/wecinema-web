"use client";
// Upload service types and utilities for marketplace delivery attachments

export interface UploadedFile {
  filename:    string;
  originalName?: string;
  url:         string;
  key?:        string;
  size?:       number;
  mimeType?:   string;
  contentType?: string;
}
