"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileWarning, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import Papa from 'papaparse';
import { useProductStore, type Product } from "@/lib/store";

// CSVテンプレートデータ
const csvTemplates = {
  products: [
    ['商品コード', '商品名', 'ケースあたりの数量', '最小在庫数'],
    ['PRD001', 'プレミアムコーヒー豆', '24', '800'],
    ['PRD002', 'オーガニック紅茶', '36', '720'],
    ['PRD003', '抹茶パウダー', '20', '400'],
  ],
  shelves: [
    ['商品コード', '列', '番目', 'レベル', 'ケース数'],
    ['PRD001', 'A', '1', '1', '24'],
    ['PRD001', 'B', '3', '2', '26'],
    ['PRD002', 'A', '1', '1', '12'],
  ],
};

export function Reports() {
  const { toast } = useToast();
  const [importType, setImportType] = useState<'products' | 'shelves' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { products, setProducts } = useProductStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
    } else {
      toast({
        title: "エラー",
        description: "CSVファイルを選択してください。",
        variant: "destructive",
      });
      e.target.value = '';
    }
  };

  const handleImport = () => {
    if (!selectedFile || !importType) {
      toast({
        title: "エラー",
        description: "ファイルを選択してください。",
        variant: "destructive",
      });
      return;
    }

    Papa.parse(selectedFile, {
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error('CSVファイルの解析中にエラーが発生しました');
          }

          const rows = results.data as string[][];
          if (rows.length < 2) {
            throw new Error('データが不足しています');
          }

          // ヘッダーの検証
          const headers = rows[0];
          if (importType === 'products') {
            if (!validateProductHeaders(headers)) {
              throw new Error('商品データのヘッダーが正しくありません');
            }
            
            // 商品データの処理
            const newProducts: Product[] = rows.slice(1).map(row => {
              if (row.length < 4) return null;
              return {
                code: row[0],
                name: row[1],
                quantityPerCase: parseInt(row[2], 10),
                minimumStock: parseInt(row[3], 10),
                totalCases: 0,
                totalQuantity: 0,
                locations: []
              };
            }).filter((p): p is Product => p !== null);

            // 既存の商品データとマージ
            const existingCodes = new Set(products.map(p => p.code));
            const uniqueNewProducts = newProducts.filter(p => !existingCodes.has(p.code));
            
            setProducts([...products, ...uniqueNewProducts]);

            toast({
              title: "インポート完了",
              description: `${uniqueNewProducts.length}件の商品データをインポートしました。`,
            });
          } else {
            if (!validateShelfHeaders(headers)) {
              throw new Error('棚割り当てデータのヘッダーが正しくありません');
            }

            // 棚割り当てデータの処理
            const shelfAssignments = rows.slice(1).map(row => {
              if (row.length < 5) return null;
              return {
                code: row[0],
                column: row[1],
                position: row[2],
                level: row[3],
                cases: parseInt(row[4], 10)
              };
            }).filter((a): a is { code: string; column: string; position: string; level: string; cases: number; } => a !== null);

            // 商品データの更新
            const updatedProducts = products.map(product => {
              const assignments = shelfAssignments.filter(a => a.code === product.code);
              if (assignments.length === 0) return product;

              const locations = assignments.map(a => ({
                column: a.column,
                position: a.position,
                level: a.level,
                cases: a.cases
              }));

              const totalCases = locations.reduce((sum, loc) => sum + loc.cases, 0);
              const totalQuantity = totalCases * product.quantityPerCase;

              return {
                ...product,
                locations,
                totalCases,
                totalQuantity
              };
            });

            setProducts(updatedProducts);

            toast({
              title: "インポート完了",
              description: "棚割り当てデータをインポートしました。",
            });
          }

          setIsImportDialogOpen(false);
          setSelectedFile(null);
          setImportType(null);
        } catch (error) {
          toast({
            title: "エラー",
            description: error instanceof Error ? error.message : "ファイルの処理中にエラーが発生しました。",
            variant: "destructive",
          });
        }
      },
      header: false,
      skipEmptyLines: true
    });
  };

  const validateProductHeaders = (headers: string[]) => {
    const requiredHeaders = ['商品コード', '商品名', 'ケースあたりの数量', '最小在庫数'];
    return requiredHeaders.every((header, index) => headers[index] === header);
  };

  const validateShelfHeaders = (headers: string[]) => {
    const requiredHeaders = ['商品コード', '列', '番目', 'レベル', 'ケース数'];
    return requiredHeaders.every((header, index) => headers[index] === header);
  };

  const handleExport = (type: 'inventory' | 'transactions' | 'alerts') => {
    let data: string[][] = [];
    let filename = '';

    switch (type) {
      case 'inventory':
        data = [
          ['商品コード', '商品名', '総ケース数', '総在庫数', '最小在庫数'],
          ...products.map(item => [
            item.code,
            item.name,
            item.totalCases.toString(),
            item.totalQuantity.toString(),
            item.minimumStock.toString()
          ])
        ];
        filename = '在庫状況.csv';
        break;

      case 'alerts':
        data = [
          ['商品コード', '商品名', '現在庫数', '最小在庫数', '不足数'],
          ...products
            .filter(item => item.totalQuantity < item.minimumStock)
            .map(item => [
              item.code,
              item.name,
              item.totalQuantity.toString(),
              item.minimumStock.toString(),
              (item.minimumStock - item.totalQuantity).toString()
            ])
        ];
        filename = '在庫不足レポート.csv';
        break;
    }

    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "エクスポート完了",
      description: `${filename}をダウンロードしました。`,
    });
  };

  const handleTemplateDownload = (type: 'products' | 'shelves') => {
    const data = csvTemplates[type];
    const filename = type === 'products' ? '商品データ_テンプレート.csv' : '棚割り当て_テンプレート.csv';
    
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "テンプレートダウンロード完了",
      description: `${filename}をダウンロードしました。`,
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>データインポート</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            CSVファイルから商品データと棚割り当てをインポートできます。
          </p>
          <div className="grid gap-2">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setImportType('products');
                    setSelectedFile(null);
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  商品データインポート
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {importType === 'products' ? '商品データ' : '棚割り当て'}のインポート
                  </DialogTitle>
                  <DialogDescription>
                    CSVファイルを選択してインポートを実行してください。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>CSVファイルを選択</Label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                    />
                  </div>
                  {selectedFile && (
                    <div className="text-sm text-muted-foreground">
                      選択されたファイル: {selectedFile.name}
                    </div>
                  )}
                  {!selectedFile && (
                    <div className="flex items-center text-yellow-600 text-sm">
                      <FileWarning className="h-4 w-4 mr-2" />
                      ファイルが選択されていません
                    </div>
                  )}
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <Label>CSVファイルの形式</Label>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>以下の列が必要です：</p>
                      {importType === 'products' ? (
                        <ul className="list-disc list-inside">
                          <li>商品コード (例: PRD001)</li>
                          <li>商品名 (例: プレミアムコーヒー豆)</li>
                          <li>ケースあたりの数量 (例: 24)</li>
                          <li>最小在庫数 (例: 800)</li>
                        </ul>
                      ) : (
                        <ul className="list-disc list-inside">
                          <li>商品コード (例: PRD001)</li>
                          <li>列 (例: A)</li>
                          <li>番目 (例: 1)</li>
                          <li>レベル (例: 1)</li>
                          <li>ケース数 (例: 24)</li>
                        </ul>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => handleTemplateDownload(importType || 'products')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      テンプレートをダウンロード
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsImportDialogOpen(false);
                      setSelectedFile(null);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    インポート実行
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setImportType('shelves');
                    setSelectedFile(null);
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  棚割り当てインポート
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>棚割り当てのインポート</DialogTitle>
                  <DialogDescription>
                    CSVファイルを選択してインポートを実行してください。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>CSVファイルを選択</Label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                    />
                  </div>
                  {selectedFile && (
                    <div className="text-sm text-muted-foreground">
                      選択されたファイル: {selectedFile.name}
                    </div>
                  )}
                  {!selectedFile && (
                    <div className="flex items-center text-yellow-600 text-sm">
                      <FileWarning className="h-4 w-4 mr-2" />
                      ファイルが選択されていません
                    </div>
                  )}
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <Label>CSVファイルの形式</Label>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>以下の列が必要です：</p>
                      <ul className="list-disc list-inside">
                        <li>商品コード (例: PRD001)</li>
                        <li>列 (例: A)</li>
                        <li>番目 (例: 1)</li>
                        <li>レベル (例: 1)</li>
                        <li>ケース数 (例: 24)</li>
                      </ul>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => handleTemplateDownload('shelves')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      テンプレートをダウンロード
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsImportDialogOpen(false);
                      setSelectedFile(null);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    インポート実行
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>レポート出力</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            在庫状況と取引履歴のレポートをダウンロードできます。
          </p>
          <div className="grid gap-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleExport('inventory')}
            >
              <Download className="mr-2 h-4 w-4" />
              現在の在庫状況
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleExport('alerts')}
            >
              <Download className="mr-2 h-4 w-4" />
              在庫不足レポート
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}