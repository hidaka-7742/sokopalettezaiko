"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProductStore } from "@/lib/store";

export function Products() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    code: "",
    name: "",
    quantityPerCase: ""
  });

  const { products, addProduct } = useProductStore();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    // バリデーション
    if (!newProduct.code || !newProduct.name || !newProduct.quantityPerCase) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください。",
        variant: "destructive",
      });
      return;
    }

    // 商品コードの重複チェック
    if (products.some(p => p.code === newProduct.code)) {
      toast({
        title: "エラー",
        description: "この商品コードは既に使用されています。",
        variant: "destructive",
      });
      return;
    }

    // 新商品を追加
    const newProductData = {
      ...newProduct,
      quantityPerCase: parseInt(newProduct.quantityPerCase),
      totalCases: 0,
      totalQuantity: 0,
      locations: [],
      minimumStock: 0,
    };

    addProduct(newProductData);
    
    // フォームをリセット
    setNewProduct({
      code: "",
      name: "",
      quantityPerCase: ""
    });
    
    setIsDialogOpen(false);

    toast({
      title: "商品登録完了",
      description: `${newProduct.name}を登録しました。`,
    });
  };

  const filteredProducts = products
    .filter(product => 
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      
      const aValue = a[sortField as keyof typeof a];
      const bValue = b[sortField as keyof typeof b];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-[300px]">
          <Input
            placeholder="商品コードまたは商品名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> 商品登録
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規商品登録</DialogTitle>
              <DialogDescription>
                新しい商品の情報を入力してください </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">商品コード</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="例: PRD001"
                  value={newProduct.code}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">商品名</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="例: プレミアムコーヒー豆"
                  value={newProduct.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityPerCase">ケースあたりの数量</Label>
                <Input
                  id="quantityPerCase"
                  name="quantityPerCase"
                  type="number"
                  min="1"
                  placeholder="例: 24"
                  value={newProduct.quantityPerCase}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                登録
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('code')}>
                  商品コード {sortField === 'code' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  商品名 {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>ケースあたり数量</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('totalCases')}>
                  総ケース数 {sortField === 'totalCases' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('totalQuantity')}>
                  総在庫数 {sortField === 'totalQuantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>保管場所</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.code}>
                  <TableCell>{product.code}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.quantityPerCase}</TableCell>
                  <TableCell>{product.totalCases}</TableCell>
                  <TableCell>{product.totalQuantity}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {product.locations.map((loc, index) => (
                        <div key={index} className="text-sm">
                          {loc.column}列 {loc.position}番目 レベル{loc.level}: {loc.cases}ケース
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.totalQuantity < product.minimumStock ? (
                      <div className="flex items-center text-yellow-600">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span className="text-sm">在庫不足</span>
                      </div>
                    ) : (
                      <span className="text-green-600 text-sm">適正</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      編集
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}