import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Download, ExternalLink } from 'lucide-react';
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

const StudentMaterials = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!profile?.section) return;
      const { data } = await supabase.from('lesson_materials').select('*').eq('section', profile.section).order('created_at', { ascending: false });
      setMaterials((data as LessonMaterial[]) || []);
      setLoading(false);
    };
    fetchMaterials();
  }, [profile]);

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
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-bold text-foreground">Lesson Materials</h1>
        </div>
      </header>

      <main className="px-4 py-4">
        {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : materials.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No materials shared for your section yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map(mat => (
              <Card key={mat.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getFileIcon(mat.file_name)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{mat.title}</h3>
                      {mat.description && <p className="text-sm text-muted-foreground mt-1">{mat.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{mat.file_name}</p>
                      <Badge variant="outline" className="text-xs mt-2">{format(new Date(mat.created_at), 'MMM d, yyyy')}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <a href={mat.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <a href={mat.file_url} download><Download className="h-4 w-4" /></a>
                      </Button>
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

export default StudentMaterials;
