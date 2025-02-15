"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight, MoveRight, Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProductStore } from "@/lib/store";
type Location = {
  column: string;
  position: string;
  level: string;
};


// 保管場所の構造データ
const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
const POSITIONS = Array.from({ length: 15 }, (_, i) => i + 1);
const SHELF_LEVELS = [1, 2, 3];

type InventoryAction = 'outbound' | 'move';

interface LocationInfo {
  column: string;
  position: string;
  level: string;
}

interface InventoryItem {
  code: string;
  name: string;
  cases: number;
}

interface TargetLocation {
  column: string;
  position: string;
  level: string;
}

export function Inventory() {
  const { toast } = useToast();
  const { products, updateProduct } = useProductStore();
  const [searchInbound, setSearchInbound] = useState("");
  const [searchOutbound, setSearchOutbound] = useState("");
  const [searchMove, setSearchMove] = useState("");
  const [selectedInbound, setSelectedInbound] = useState("");
  const [selectedOutbound, setSelectedOutbound] = useState("");
  const [selectedMove, setSelectedMove] = useState("");
  const [selectedInboundColumn, setSelectedInboundColumn] = useState("");
  const [selectedInboundPosition, setSelectedInboundPosition] = useState("");
  const [selectedInboundLevel, setSelectedInboundLevel] = useState("");
  const [selectedOutboundColumn, setSelectedOutboundColumn] = useState("");
  const [selectedOutboundPosition, setSelectedOutboundPosition] = useState("");
  const [selectedOutboundLevel, setSelectedOutboundLevel] = useState("");
  const [selectedMoveFromColumn, setSelectedMoveFromColumn] = useState("");
  const [selectedMoveFromPosition, setSelectedMoveFromPosition] = useState("");
  const [selectedMoveFromLevel, setSelectedMoveFromLevel] = useState("");
  const [selectedMoveToColumn, setSelectedMoveToColumn] = useState("");
  const [selectedMoveToPosition, setSelectedMoveToPosition] = useState("");
  const [selectedMoveToLevel, setSelectedMoveToLevel] = useState("");
  const [selectedColumnView, setSelectedColumnView] = useState("");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<InventoryAction | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [targetLocation, setTargetLocation] = useState<TargetLocation | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [inboundCases, setInboundCases] = useState<number>(0);
  const [outboundCases, setOutboundCases] = useState<number>(0);
  const [moveCases, setMoveCases] = useState<number>(0);

  // 選択された場所の在庫を取得
  const getInventoryForLocation = (column: string, position: string, level: string) => {
    const inventory: InventoryItem[] = [];
    products.forEach(product => {
      const location = product.locations.find(
        loc => loc.column === column && 
              loc.position === position && 
              loc.level === level
      );
    
      if (!location) return; // ✅ location が undefined の場合、処理をスキップ
    
      inventory.push({
        ...product,
        location: location,
        cases: product.totalCases ?? 0 // ✅ 必要に応じて適切な値をセット
      } as InventoryItem);
      
    
      if (location) {
        inventory.push({
          code: product.code,
          name: product.name,
          cases: location.cases
        });
      }
    });
    return inventory;
  };

  const handleActionClick = (
    action: InventoryAction,
    product: InventoryItem,
    location: LocationInfo
  ) => {
    setCurrentAction(action);
    setSelectedProduct(product);
    setSelectedLocation(location);
    setQuantity(0);
    setActionDialogOpen(true);
  };

  const handleActionConfirm = () => {
    if (!selectedProduct || !selectedLocation || !quantity) {
      toast({
        title: "エラー",
        description: "必要な情報が不足しています。",
        variant: "destructive",
      });
      return;
    }

    const product = products.find(p => p.code === selectedProduct.code);
    if (!product) {
      toast({
        title: "エラー",
        description: "商品が見つかりません。",
        variant: "destructive",
      });
      return;
    }

    const updatedProduct = { ...product };
    
    if (currentAction === 'outbound') {
      // 出庫処理
      const locationIndex = updatedProduct.locations.findIndex(
        loc => loc.column === selectedLocation.column && 
              loc.position === selectedLocation.position && 
              loc.level === selectedLocation.level
      );

      if (locationIndex === -1) {
        toast({
          title: "エラー",
          description: "指定された場所に在庫がありません。",
          variant: "destructive",
        });
        return;
      }

      const existingLocation = updatedProduct.locations[locationIndex];
      if (existingLocation.cases < quantity) {
        toast({
          title: "エラー",
          description: "指定された数量が在庫数を超えています。",
          variant: "destructive",
        });
        return;
      }

      existingLocation.cases -= quantity;
      if (existingLocation.cases === 0) {
        updatedProduct.locations.splice(locationIndex, 1);
      }

      updatedProduct.totalCases -= quantity;
      updatedProduct.totalQuantity -= quantity * updatedProduct.quantityPerCase;

    } else if (currentAction === 'move') {
      if (!targetLocation) {
        toast({
          title: "エラー",
          description: "移動先を選択してください。",
          variant: "destructive",
        });
        return;
      }

      // 移動処理
      const fromLocationIndex = updatedProduct.locations.findIndex(
        loc => loc.column === selectedLocation.column && 
              loc.position === selectedLocation.position && 
              loc.level === selectedLocation.level
      );

      if (fromLocationIndex === -1) {
        toast({
          title: "エラー",
          description: "移動元の場所に在庫がありません。",
          variant: "destructive",
        });
        return;
      }

      const fromLocation = updatedProduct.locations[fromLocationIndex];
      if (fromLocation.cases < quantity) {
        toast({
          title: "エラー",
          description: "指定された数量が在庫数を超えています。",
          variant: "destructive",
        });
        return;
      }

      // 移動元から減らす
      fromLocation.cases -= quantity;
      if (fromLocation.cases === 0) {
        updatedProduct.locations.splice(fromLocationIndex, 1);
      }

      // 移動先に追加
      const toLocation = updatedProduct.locations.find(
        loc => loc.column === targetLocation.column && 
              loc.position === targetLocation.position && 
              loc.level === targetLocation.level
      );

      if (toLocation) {
        toLocation.cases += quantity;
      } else {
        updatedProduct.locations.push({
          column: targetLocation.column,
          position: targetLocation.position,
          level: targetLocation.level,
          cases: quantity
        });
      }
    }

    // 商品データを更新
    updateProduct(product.code, updatedProduct);

    const actionText = currentAction === 'outbound' ? '出庫' : '移動';
    toast({
      title: `${actionText}完了`,
      description: `${selectedProduct.name}を${quantity}ケース${actionText}しました。`,
    });

    setActionDialogOpen(false);
    setCurrentAction(null);
    setSelectedProduct(null);
    setSelectedLocation(null);
    setTargetLocation(null);
    setQuantity(0);
  };

  const handleSearchBasedAction = (type: 'inbound' | 'outbound' | 'move') => {
    let actionText = '';
    let location: Location | null = null;
    let product = null;
    let cases = 0;

    switch (type) {
      case 'inbound':
        if (!selectedInbound || !selectedInboundColumn || !selectedInboundPosition || !selectedInboundLevel || !inboundCases) {
          toast({
            title: "エラー",
            description: "必要な情報が不足しています。",
            variant: "destructive",
          });
          return;
        }
        actionText = '入庫';
        product = products.find(p => p.code === selectedInbound);
        location = {  // 修正後！
          column: selectedInboundColumn,
          position: selectedInboundPosition,
          level: selectedInboundLevel
        };
        cases = inboundCases;
        break;

      case 'outbound':
        if (!selectedOutbound || !selectedOutboundColumn || !selectedOutboundPosition || !selectedOutboundLevel || !outboundCases) {
          toast({
            title: "エラー",
            description: "必要な情報が不足しています。",
            variant: "destructive",
          });
          return;
        }
        actionText = '出庫';
        product = products.find(p => p.code === selectedOutbound);
        location = {  // 修正後！
          column: selectedOutboundColumn,
          position: selectedOutboundPosition,
          level: selectedOutboundLevel
        };
        cases = outboundCases;
        break;

      case 'move':
        if (!selectedMove || !selectedMoveFromColumn || !selectedMoveFromPosition || !selectedMoveFromLevel ||
            !selectedMoveToColumn || !selectedMoveToPosition || !selectedMoveToLevel || !moveCases) {
          toast({
            title: "エラー",
            description: "必要な情報が不足しています。",
            variant: "destructive",
          });
          return;
        }
        actionText = '移動';
        product = products.find(p => p.code === selectedMove);
        location = {
          column: selectedMoveFromColumn,
          position: selectedMoveFromPosition,
          level: selectedMoveFromLevel
        };
        cases = moveCases;
        break;
    }

    if (!product || !location) {
      toast({
        title: "エラー",
        description: "商品または場所の情報が不正です。",
        variant: "destructive",
      });
      return;
    }

    // 在庫データの更新
    const updatedProduct = { ...product };
    
    if (type === 'inbound') {
// 入庫処理
if (!location) return;  // ✅ location が null の場合は処理をスキップ
const existingLocation = updatedProduct.locations.find(
  loc => loc.column === location!.column &&
         loc.position === location!.position &&
         loc.level === location!.level
);

           

      if (existingLocation) {
        existingLocation.cases += cases;
      } else {
        updatedProduct.locations.push({
          column: location.column,
          position: location.position,
          level: location.level,
          cases: cases
        });
      }

      updatedProduct.totalCases += cases;
      updatedProduct.totalQuantity += cases * updatedProduct.quantityPerCase;

    } else if (type === 'outbound') {
      // 出庫処理
      if (!location) return;  // ✅ location が null の場合は処理をスキップ

      const locationIndex = updatedProduct.locations.findIndex(
        loc => loc.column === location!.column &&
               loc.position === location!.position &&
               loc.level === location!.level
      );
      
      if (locationIndex === -1) {
        toast({
          title: "エラー",
          description: "指定された場所に在庫がありません。",
          variant: "destructive",
        });
        return;
      }

      const existingLocation = updatedProduct.locations[locationIndex];
      if (existingLocation.cases < cases) {
        toast({
          title: "エラー",
          description: "指定された数量が在庫数を超えています。",
          variant: "destructive",
        });
        return;
      }

      existingLocation.cases -= cases;
      if (existingLocation.cases === 0) {
        updatedProduct.locations.splice(locationIndex, 1);
      }

      updatedProduct.totalCases -= cases;
      updatedProduct.totalQuantity -= cases * updatedProduct.quantityPerCase;

    } else if (type === 'move') {
      // 移動処理
      if (!location) return;  // ✅ location が null の場合は処理をスキップ

      const fromLocationIndex = updatedProduct.locations.findIndex(
        loc => loc.column === location!.column &&
               loc.position === location!.position &&
               loc.level === location!.level
      );
      

      if (fromLocationIndex === -1) {
        toast({
          title: "エラー",
          description: "移動元の場所に在庫がありません。",
          variant: "destructive",
        });
        return;
      }

      const fromLocation = updatedProduct.locations[fromLocationIndex];
      if (fromLocation.cases < cases) {
        toast({
          title: "エラー",
          description: "指定された数量が在庫数を超えています。",
          variant: "destructive",
        });
        return;
      }

      // 移動元から減らす
      fromLocation.cases -= cases;
      if (fromLocation.cases === 0) {
        updatedProduct.locations.splice(fromLocationIndex, 1);
      }

      // 移動先に追加
      const toLocation = updatedProduct.locations.find(
        loc => loc.column === selectedMoveToColumn && 
              loc.position === selectedMoveToPosition && 
              loc.level === selectedMoveToLevel
      );

      if (toLocation) {
        toLocation.cases += cases;
      } else {
        updatedProduct.locations.push({
          column: selectedMoveToColumn,
          position: selectedMoveToPosition,
          level: selectedMoveToLevel,
          cases: cases
        });
      }
    }

    // 商品データを更新
    updateProduct(product.code, updatedProduct);

    toast({
      title: `${actionText}完了`,
      description: `${product.name}を${cases}ケース${actionText}しました。`,
    });

    // フォームをリセット
    switch (type) {
      case 'inbound':
        setSelectedInbound("");
        setSelectedInboundColumn("");
        setSelectedInboundPosition("");
        setSelectedInboundLevel("");
        setInboundCases(0);
        setSearchInbound("");
        break;
      case 'outbound':
        setSelectedOutbound("");
        setSelectedOutboundColumn("");
        setSelectedOutboundPosition("");
        setSelectedOutboundLevel("");
        setOutboundCases(0);
        setSearchOutbound("");
        break;
      case 'move':
        setSelectedMove("");
        setSelectedMoveFromColumn("");
        setSelectedMoveFromPosition("");
        setSelectedMoveFromLevel("");
        setSelectedMoveToColumn("");
        setSelectedMoveToPosition("");
        setSelectedMoveToLevel("");
        setMoveCases(0);
        setSearchMove("");
        break;
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="search" className="space-y-4">
        <TabsList>
          <TabsTrigger value="search">商品検索から操作</TabsTrigger>
          <TabsTrigger value="location">保管場所から操作</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  入庫処理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>商品選択</Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input 
                          placeholder="商品コードまたは商品名で検索" 
                          value={searchInbound}
                          onChange={(e) => setSearchInbound(e.target.value)}
                        />
                        <div className="absolute right-0 top-0 h-full flex items-center pr-3">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      {searchInbound && (
                        <Select value={selectedInbound} onValueChange={setSelectedInbound}>
                          <SelectTrigger>
                            <SelectValue placeholder="商品を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {products
                              .filter(p => 
                                p.code.toLowerCase().includes(searchInbound.toLowerCase()) ||
                                p.name.toLowerCase().includes(searchInbound.toLowerCase())
                              )
                              .map(product => (
                                <SelectItem key={product.code} value={product.code}>
                                  {product.name} ({product.code})
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>保管場所の選択</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={selectedInboundColumn} onValueChange={setSelectedInboundColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="列" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map(column => (
                            <SelectItem key={column} value={column}>{column}列</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedInboundPosition} onValueChange={setSelectedInboundPosition}>
                        <SelectTrigger>
                          <SelectValue placeholder="番目" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map(position => (
                            <SelectItem key={position} value={position.toString()}>{position}番目</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedInboundLevel} onValueChange={setSelectedInboundLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="レベル" />
                        </SelectTrigger>
                        <SelectContent>
                          {SHELF_LEVELS.map(level => (
                            <SelectItem key={level} value={level.toString()}>レベル {level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      type="number" 
                      placeholder="ケース数" 
                      value={inboundCases || ''}
                      onChange={(e) => setInboundCases(parseInt(e.target.value) || 0)}
                      min="1"
                    />
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleSearchBasedAction('inbound')}
                    >
                      入庫登録
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <ArrowDownRight className="mr-2 h-4 w-4" />
                  出庫処理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>商品選択</Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input 
                          placeholder="商品コードまたは商品名で検索" 
                          value={searchOutbound}
                          onChange={(e) => setSearchOutbound(e.target.value)}
                        />
                        <div className="absolute right-0 top-0 h-full flex items-center pr-3">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      {searchOutbound && (
                        <Select value={selectedOutbound} onValueChange={setSelectedOutbound}>
                          <SelectTrigger>
                            <SelectValue placeholder="商品を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {products
                              .filter(p => 
                                p.code.toLowerCase().includes(searchOutbound.toLowerCase()) ||
                                p.name.toLowerCase().includes(searchOutbound.toLowerCase())
                              )
                              .map(product => (
                                <SelectItem key={product.code} value={product.code}>
                                  {product.name} ({product.code})
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>保管場所の選択</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={selectedOutboundColumn} onValueChange={setSelectedOutboundColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="列" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map(column => (
                            <SelectItem key={column} value={column}>{column}列</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedOutboundPosition} onValueChange={setSelectedOutboundPosition}>
                        <SelectTrigger>
                          <SelectValue placeholder="番目" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map(position => (
                            <SelectItem key={position} value={position.toString()}>{position}番目</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedOutboundLevel} onValueChange={setSelectedOutboundLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="レベル" />
                        </SelectTrigger>
                        <SelectContent>
                          {SHELF_LEVELS.map(level => (
                            <SelectItem key={level} value={level.toString()}>レベル {level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      type="number" 
                      placeholder="ケース数" 
                      value={outboundCases || ''}
                      onChange={(e) => setOutboundCases(parseInt(e.target.value) || 0)}
                      min="1"
                    />
                    <Button 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleSearchBasedAction('outbound')}
                    >
                      出庫登録
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <MoveRight className="mr-2 h-4 w-4" />
                  在庫移動
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>商品選択</Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input 
                          placeholder="商品コードまたは商品名で検索" 
                          value={searchMove}
                          onChange={(e) => setSearchMove(e.target.value)}
                        />
                        <div className="absolute right-0 top-0 h-full flex items-center pr-3">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      {searchMove && (
                        <Select value={selectedMove} onValueChange={setSelectedMove}>
                          <SelectTrigger>
                            <SelectValue placeholder="商品を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {products
                              .filter(p => 
                                p.code.toLowerCase().includes(searchMove.toLowerCase()) ||
                                p.name.toLowerCase().includes(searchMove.toLowerCase())
                              )
                              .map(product => (
                                <SelectItem key={product.code} value={product.code}>
                                  {product.name} ({product.code})
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>移動元の選択</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={selectedMoveFromColumn} onValueChange={setSelectedMoveFromColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="列" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map(column => (
                            <SelectItem key={column} value={column}>{column}列</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedMoveFromPosition} onValueChange={setSelectedMoveFromPosition}>
                        <SelectTrigger>
                          <SelectValue placeholder="番目" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map(position => (
                            <SelectItem key={position} value={position.toString()}>{position}番目</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedMoveFromLevel} onValueChange={setSelectedMoveFromLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="レベル" />
                        </SelectTrigger>
                        <SelectContent>
                          {SHELF_LEVELS.map(level => (
                            <SelectItem key={level} value={level.toString()}>レベル {level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>移動先の選択</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={selectedMoveToColumn} onValueChange={setSelectedMoveToColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="列" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map(column => (
                            <SelectItem key={column} value={column}>{column}列</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedMoveToPosition} onValueChange={setSelectedMoveToPosition}>
                        <SelectTrigger>
                          <SelectValue placeholder="番目" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map(position => (
                            <SelectItem key={position} value={position.toString()}>{position}番目</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedMoveToLevel} onValueChange={setSelectedMoveToLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="レベル" />
                        </SelectTrigger>
                        <SelectContent>
                          {SHELF_LEVELS.map(level => (
                            <SelectItem key={level} value={level.toString()}>レベル {level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      type="number" 
                      placeholder="ケース数" 
                      value={moveCases || ''}
                      onChange={(e) => setMoveCases(parseInt(e.target.value) || 0)}
                      min="1"
                    />
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleSearchBasedAction('move')}
                    >
                      移動実行
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="location">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>保管場所の状況</CardTitle>
              <Select value={selectedColumnView} onValueChange={setSelectedColumnView}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map(column => (
                    <SelectItem key={column} value={column}>{column}列</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {selectedColumnView && (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {POSITIONS.map((position) => (
                    <Card key={position}>
                 ```tsx
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                              {selectedColumnView}列 {position}番目
                            </h3>
                          </div>
                          
                          {SHELF_LEVELS.map((level) => {
                            const inventory = getInventoryForLocation(selectedColumnView, position.toString(), level.toString());
                            return (
                              <div key={level} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>レベル {level}</Label>
                                  <Button variant="ghost" size="sm">
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                <ScrollArea className="h-auto max-h-32 rounded-md border p-2">
                                  {inventory.length > 0 ? (
                                    <div className="space-y-2">
                                      {inventory.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between space-x-2">
                                          <div className="flex-1">
                                            <div className="text-sm font-medium">{item.name}</div>
                                            <div className="text-sm text-gray-500">{item.cases}ケース</div>
                                          </div>
                                          <div className="flex space-x-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                              onClick={() => handleActionClick('outbound', item, {
                                                column: selectedColumnView,
                                                position: position.toString(),
                                                level: level.toString()
                                              })}
                                            >
                                              <ArrowDownRight className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                              onClick={() => handleActionClick('move', item, {
                                                column: selectedColumnView,
                                                position: position.toString(),
                                                level: level.toString()
                                              })}
                                            >
                                              <MoveRight className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-400 text-center py-2">
                                      商品なし
                                    </div>
                                  )}
                                </ScrollArea>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentAction === 'outbound' ? '出庫処理' : '在庫移動'}
            </DialogTitle>
            <DialogDescription>
              以下の内容で{currentAction === 'outbound' ? '出庫' : '移動'}を実行します。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>商品情報</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium">{selectedProduct?.name}</div>
                <div className="text-sm text-gray-500">
                  現在の在庫: {selectedProduct?.cases}ケース
                </div>
                <div className="text-sm text-gray-500">
                  場所: {selectedLocation?.column}列 {selectedLocation?.position}番目 レベル{selectedLocation?.level}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>処理数量</Label>
              <Input
                type="number"
                min="1"
                max={selectedProduct?.cases}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="ケース数を入力"
              />
            </div>

            {currentAction === 'move' && (
              <div className="space-y-2">
                <Label>移動先</Label>
                <div className="grid grid-cols-3 gap-2">
                <Select
  value={targetLocation?.column}
  onValueChange={(value) =>
    setTargetLocation(prev => ({
      column: value,
      position: prev?.position ?? "",
      level: prev?.level ?? ""
    } as TargetLocation))  // ✅ 型を明示する
  }
>

                    <SelectTrigger>
                      <SelectValue placeholder="列" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map(column => (
                        <SelectItem key={column} value={column}>{column}列</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={targetLocation?.position}
                    onValueChange={(value) =>
                      setTargetLocation(prev => ({
                        column: value,
                        position: prev?.position ?? "",
                        level: prev?.level ?? ""
                      } as TargetLocation))  // 型を TargetLocation に強制キャスト
                    }
                    
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="番目" />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map(position => (
                        <SelectItem key={position} value={position.toString()}>{position}番目</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={targetLocation?.level}
                    onValueChange={(value) =>
                      setTargetLocation(prev => ({
                        level: value,
                        column: prev?.column ?? "",
                        position: prev?.position ?? ""
                      } as TargetLocation))  // ✅ 型を明示
                    }
                    
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="レベル" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHELF_LEVELS.map(level => (
                        <SelectItem key={level} value={level.toString()}>レベル{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setCurrentAction(null);
                setSelectedProduct(null);
                setSelectedLocation(null);
                setTargetLocation(null);
                setQuantity(0);
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleActionConfirm}
              className={currentAction === 'outbound' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {currentAction === 'outbound' ? '出庫' : '移動'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}