import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Upload, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

interface LessonMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  section: string;
  created_at: string;
}

const SECTIONS = [
  'Grade 7 - St. Augustine', 'Grade 7 - St. Benedict', 'Grade 7 - St. Catherine',
  'Grade 8 - St. Dominic', 'Grade 8 - St. Elizabeth', 'Grade 8 - St. Francis',
  'Grade 9 - St. Gregory', 'Grade 9 - St. Helena', 'Grade 9 - St. Ignatius',
  'Grade 10 - St. Jerome', 'Grade 10 - St. Kevin', 'Grade 10 - St. Lawrence',
  'Grade 11 - STEM', 'Grade 11 - ABM', 'Grade 11 - HUMSS', 'Grade 11 - GAS',
  'Grade 12 - STEM', 'Grade 12 - ABM', 'Grade 12 - HUMSS', 'Grade 12 - GAS',
];

const AdminLessonMaterials = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [section, setSection] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('lesson_materials').select('*').order('created_at', { ascending: false });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setMaterials((data as LessonMaterial[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleUpload = async () => {
    if (!title || !section || !file) { toast({ title: 'Error', description: 'Title, section, and file are required', variant: 'destructive' }); return; }
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${section}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('lesson-materials').upload(filePath, file);
    if (uploadError) { toast({ title: 'Upload Error', description: uploadError.message, variant: 'destructive' }); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('lesson-materials').getPublicUrl(filePath);

    const { error } = await supabase.from('lesson_materials').insert({
      title,
      description: description || null,
      file_url: urlData.publicUrl,
      file_name: file.name,
      section,
      created_by: user!.id,
    });

    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); setUploading(false); return; }
    toast({ title: 'Material uploaded!' });
    setTitle(''); setDescription(''); setSection(''); setFile(null);
    setDialogOpen(false);
    setUploading(false);
    fetchMaterials();
  };

  const handleDelete = async (mat: LessonMaterial) => {
    // Delete from storage
    const path = mat.file_url.split('/lesson-materials/')[1];
    if (path) await supabase.storage.from('lesson-materials').remove([decodeURIComponent(path)]);
    // Delete record
    await supabase.from('lesson_materials').delete().eq('id', mat.id);
    toast({ title: 'Material deleted' });
    fetchMaterials();
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['ppt', 'pptx'].includes(ext || '')) return '📊';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    return '📁';
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
            <h1 className="text-lg font-bold text-foreground">Lesson Materials</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Upload</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Material</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Material title" value={title} onChange={e => setTitle(e.target.value)} />
                <Textarea placeholder="Description / instructions" value={description} onChange={e => setDescription(e.target.value)} />
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger><SelectValue placeholder="Assign to section" /></SelectTrigger>
                  <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <div>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)} />
                  <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> {file ? file.name : 'Choose File'}
                  </Button>
                </div>
                <Button className="w-full" onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Material'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="px-4 py-4">
        {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : materials.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No materials uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map(mat => (
              <Card key={mat.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl">{getFileIcon(mat.file_name)}</span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">{mat.title}</h3>
                        {mat.description && <p className="text-sm text-muted-foreground mt-1">{mat.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{mat.file_name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">{mat.section}</Badge>
                          <Badge variant="outline" className="text-xs">{format(new Date(mat.created_at), 'MMM d, yyyy')}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={mat.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(mat)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminLessonMaterials;
