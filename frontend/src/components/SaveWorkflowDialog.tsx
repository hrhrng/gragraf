import React, { useState } from 'react';
import { Dialog, Button, TextField, Text, Flex, Badge, IconButton } from '@radix-ui/themes';
import { Cross1Icon, PlusIcon } from '@radix-ui/react-icons';

interface SaveWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description?: string; tags: string[] }) => Promise<void>;
  currentWorkflowName?: string;
  isLoading?: boolean;
}

export const SaveWorkflowDialog: React.FC<SaveWorkflowDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  currentWorkflowName = '',
  isLoading = false
}) => {
  const [name, setName] = useState(currentWorkflowName);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('工作流名称不能为空');
      return;
    }

    setError('');
    
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        tags: tags.filter(tag => tag.trim() !== '')
      });
      
      // 重置表单
      setName('');
      setDescription('');
      setTags([]);
      setNewTag('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="500px">
        <Dialog.Title>保存工作流</Dialog.Title>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            {error && (
              <Text color="red" size="2">
                {error}
              </Text>
            )}

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="medium">
                工作流名称 *
              </Text>
              <TextField.Root
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="输入工作流名称"
                disabled={isLoading}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="medium">
                描述
              </Text>
              <TextField.Root
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                placeholder="输入工作流描述（可选）"
                disabled={isLoading}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="medium">
                标签
              </Text>
              
              {tags.length > 0 && (
                <Flex gap="2" wrap="wrap">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="soft" color="blue">
                      {tag}
                      <IconButton
                        size="1"
                        variant="ghost"
                        onClick={() => removeTag(tag)}
                        disabled={isLoading}
                        style={{ marginLeft: '4px' }}
                      >
                        <Cross1Icon width="10" height="10" />
                      </IconButton>
                    </Badge>
                  ))}
                </Flex>
              )}

              <Flex gap="2">
                <TextField.Root 
                  style={{ flex: 1 }}
                  value={newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                  onKeyDown={handleTagKeyPress}
                  placeholder="添加标签"
                  disabled={isLoading}
                />
                <IconButton
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim() || isLoading}
                  variant="soft"
                >
                  <PlusIcon />
                </IconButton>
              </Flex>
            </Flex>

            <Flex gap="3" justify="end" mt="4">
              <Button
                type="button"
                variant="soft"
                color="gray"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || isLoading}
                loading={isLoading}
              >
                保存
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}; 