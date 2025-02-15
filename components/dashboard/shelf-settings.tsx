"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Save, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// モックデータ - 実際の実装では、データベースから取得する
const initialShelfData = {
  'A': { positions: 15, levels: 3 },
  'B': { positions: 12, levels: 4 },
  'C': { positions: 10, levels: 3 },
  'D': { positions: 15, levels: 3 },
  'E': { positions: 8, levels: 2 },
  'F': { positions: 15, levels: 3 },
  'G': { positions: 15, levels: 3 },
  'H': { positions: 15, levels: 3 },
  'I': { positions: 15, levels: 3 },
  'J': { positions: 15, levels: 3 },
  'K': { positions: 15, levels: 3 },
};

export function ShelfSettings() {
  const { toast } = useToast();
  const [shelfData, setShelfData] = useState(initialShelfData);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [editData, setEditData] = useState({ positions: 0, levels: 0 });
  const [showWarning, setShowWarning] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);
  const [newColumnLetter, setNewColumnLetter] = useState<string>("");

  const handleEdit = (column: string) => {
    setSelectedColumn(column);
    setEditData(shelfData[column]);
    setShowWarning(false);
  };

  const handleSave = () => {
    if (selectedColumn) {
      // 在庫データとの整合性チェックが必要
      const hasInventory = false; // 実際の実装では、データベースで確認

      if (hasInventory && 
          (editData.positions < shelfData[selectedColumn].positions || 
           editData.levels < shelfData[selectedColumn].levels)) {
        setShowWarning(true);
        return;
      }

      setShelfData(prev => ({
        ...prev,
        [selectedColumn]: { ...editData }
      }));

      toast({
        title: "保存完了",
        description: `${selectedColumn}列の設定を更新しました。`,
      });

      setSelectedColumn(null);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnLetter) {
      toast({
        title: "エラー",
        description: "列を選択してください。",
        variant: "destructive",
      });
      return;
    }

    if (shelfData[newColumnLetter]) {
      toast({
        title: "エラー",
        description: `${newColumnLetter}列は既に存在します。`,
        variant: "destructive",
      });
      return;
    }

    setShelfData(prev => ({
      ...prev,
      [newColumnLetter]: { positions: 15, levels: 3 }
    }));

    toast({
      title: "列を追加",
      description: `${newColumnLetter}列を追加しました。`,
    });

    setAddColumnDialogOpen(false);
    setNewColumnLetter("");
  };

  const handleRemoveColumn = (column: string) => {
    // 在庫データとの整合性チェックが必要
    const hasInventory = false; // 実際の実装では、データベースで確認

    if (hasInventory) {
      toast({
        title: "削除できません",
        description: `${column}列には在庫データが存在するため削除できません。`,
        variant: "destructive",
      });
      return;
    }

    const newShelfData = { ...shelfData };
    delete newShelfData[column];
    setShelfData(newShelfData);
    setDeleteDialogOpen(false);
    setColumnToDelete(null);

    toast({
      title: "列を削除",
      description: `${column}列を削除しました。`,
    });
  };

  const openDeleteDialog = (column: string) => {
    setColumnToDelete(column);
    setDeleteDialogOpen(true);
  };

  // 利用可能な列の一覧を生成
  const getAvailableColumns = () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return alphabet.filter(letter => !shelfData[letter]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">棚の設定</h2>
        <Button 
          onClick={() => setAddColumnDialogOpen(true)} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" /> 列を追加
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(shelfData).sort().map(([column, data]) => (
          <Card key={column}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xl font-bold">{column}列</CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                onClick={() => openDeleteDialog(column)}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>番目の数</Label>
                    <div className="text-2xl font-bold">{data.positions}</div>
                  </div>
                  <div>
                    <Label>レベル数</Label>
                    <div className="text-2xl font-bold">{data.levels}</div>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => handleEdit(column)}
                    >
                      設定を変更
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{column}列の設定</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {showWarning && (
                        <div className="flex items-center p-4 text-yellow-800 bg-yellow-100 rounded-md">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          <p className="text-sm">
                            この変更により、既存の在庫データに影響が出る可能性があります。
                            先に在庫を移動してください。
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>番目の数</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editData.positions}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            positions: parseInt(e.target.value) || 0
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>レベル数</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editData.levels}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            levels: parseInt(e.target.value) || 0
                          }))}
                        />
                      </div>
                      <Button 
                        className="w-full mt-4"
                        onClick={handleSave}
                        disabled={showWarning}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        保存
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>列の削除確認</DialogTitle>
            <DialogDescription>
              {columnToDelete}列を削除してもよろしいですか？
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setColumnToDelete(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => columnToDelete && handleRemoveColumn(columnToDelete)}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addColumnDialogOpen} onOpenChange={setAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しい列の追加</DialogTitle>
            <DialogDescription>
              追加する列を選択してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>列の選択</Label>
              <Select value={newColumnLetter} onValueChange={setNewColumnLetter}>
                <SelectTrigger>
                  <SelectValue placeholder="列を選択" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableColumns().map(letter => (
                    <SelectItem key={letter} value={letter}>
                      {letter}列
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setAddColumnDialogOpen(false);
                setNewColumnLetter("");
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAddColumn}
              className="bg-blue-600 hover:bg-blue-700"
            >
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}