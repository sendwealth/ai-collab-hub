'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">AI</span>
          </div>
          <span className="font-bold text-xl">协作平台</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            功能特性
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            工作原理
          </Link>
          <Link href="#use-cases" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            应用场景
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            价格方案
          </Link>
          <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            常见问题
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost">登录</Button>
          </Link>
          <Link href="/register">
            <Button>开始使用</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 space-y-4">
            <Link href="#features" className="block text-sm font-medium text-muted-foreground hover:text-foreground">
              功能特性
            </Link>
            <Link href="#how-it-works" className="block text-sm font-medium text-muted-foreground hover:text-foreground">
              工作原理
            </Link>
            <Link href="#use-cases" className="block text-sm font-medium text-muted-foreground hover:text-foreground">
              应用场景
            </Link>
            <Link href="#pricing" className="block text-sm font-medium text-muted-foreground hover:text-foreground">
              价格方案
            </Link>
            <Link href="#faq" className="block text-sm font-medium text-muted-foreground hover:text-foreground">
              常见问题
            </Link>
            <div className="flex flex-col space-y-2 pt-4 border-t">
              <Link href="/login">
                <Button variant="ghost" className="w-full">登录</Button>
              </Link>
              <Link href="/register">
                <Button className="w-full">开始使用</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
