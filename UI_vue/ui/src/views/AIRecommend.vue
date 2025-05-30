<script>
import request from '@/utils/request'
import { marked } from 'marked'

export default {
  name: 'AIRecommend',
  data() {
    return {
      tags: [
        { label: '放养型', value: 'relaxed' },
        { label: 'Push型', value: 'push' },
        { label: '科研成果多', value: 'research' },
        { label: '竞赛成果多', value: 'competition' },
        { label: '项目经验丰富', value: 'project' },
        { label: '学术严谨', value: 'strict' },
        { label: '平易近人', value: 'friendly' },
        { label: '有海外经历', value: 'overseas' },
        { label: '年轻有为', value: 'young' },
        { label: '资深教授', value: 'senior' }
      ],
      selectedTags: [],
      userInput: '',
      isLoading: false,
      recommendation: '',
      teachers: [],
      userProfile: null, // 添加用户画像状态
      userId: null // 添加用户ID状态
    }
  },
  computed: {
    canSubmit() {
      return this.selectedTags.length > 0 || this.userInput.trim() !== ''
    }
  },  methods: {
    loadTeachers() {
      try {
        console.log('开始加载教师数据...')

        request.get("teachers/all").then(res => {
          console.log('API响应:', res)
          if (res.code === 200 || res.code === "0") {
            this.teachers = res.data
            console.log('成功从API获取教师数据:', this.teachers)
          } else {
            console.warn('API请求失败，使用模拟数据')
            this.useLocalData()
          }
        }).catch(error => {
          console.warn('API请求异常，使用模拟数据:', error)
          this.useLocalData()
        })
      } catch (error) {
        console.error('加载教师数据失败:', error)
        this.$message.error(`加载教师数据失败: ${error.message}`)
        this.useLocalData()
      }
    },
    useLocalData() {
      // 使用模拟数据
      console.log('使用模拟数据')
      this.teachers = [
        {
          id: 1,
          name: '黄浩',
          title: '教授',
          research_area: '大数据挖掘与分析,机器学习',
          profile_url: 'http://jszy.whu.edu.cn/huanghao',
          department: '计算机科学与技术学院',
          rank: '正高级'
        },
        {
          id: 2,
          name: '江桂佳',
          title: '教授',
          research_area: '大数据挖掘与分析,分布式系统',
          profile_url: 'https://jszy.whu.edu.cn/jianggj',
          department: '计算机科学与技术学院',
          rank: '正高级'
        },
        {
          id: 3,
          name: '刘树波',
          title: '教授',
          research_area: '嵌入式系统,物联网及其应用',
          profile_url: 'http://cs.whu.edu.cn/info/',
          department: '计算机科学与技术学院',
          rank: '正高级'
        },
        {
          id: 4,
          name: '刘咸威',
          title: '教授',
          research_area: '机器学习与智能交互,人工智能',
          profile_url: 'http://cs.whu.edu.cn/info/',
          department: '计算机科学与技术学院',
          rank: '正高级'
        },
        {
          id: 5,
          name: '牛柱光',
          title: '教授',
          research_area: '大数据挖掘与分析,机器学习',
          profile_url: 'http://cs.whu.edu.cn/info/',
          department: '计算机科学与技术学院',
          rank: '正高级'
        }
      ]

      console.log('成功加载教师模拟数据:', this.teachers)
    },
    toggleTag(tag) {
      const index = this.selectedTags.indexOf(tag)
      if (index === -1) {
        this.selectedTags.push(tag)
      } else {
        this.selectedTags.splice(index, 1)
      }
    },
    removeTag(tag) {
      const index = this.selectedTags.indexOf(tag)
      if (index !== -1) {
        this.selectedTags.splice(index, 1)
      }
    },
    getTagLabel(value) {
      const tag = this.tags.find(t => t.value === value)
      return tag ? tag.label : value
    },
    async handleSubmit() {
      if (!this.canSubmit || this.isLoading) return;

      this.isLoading = true;
      this.recommendation = '';

      try {
        // 先检查是否可以使用AI推荐
        const checkResponse = await fetch('/api/deepSeek/recommend/can-use');
        const checkResult = await checkResponse.json();

        if (!checkResult.success || !checkResult.canUse) {
          // 如果不能使用，显示提示并使用本地推荐
          this.$message.warning(`您今天的AI推荐次数已用完（每天限制${checkResult.maxCount || 2}次），请明天再试。`);
          this.useLocalRecommend();
          this.isLoading = false;
          return;
        }
        
        // 如果是最后一次使用，提醒用户
        if (checkResult.remainingCount === 1) {
          this.$message.info(`这是您今天最后一次使用AI推荐，明天再来！`);
        } else if (checkResult.remainingCount > 1) {
          this.$message.info(`您今天还可以使用AI推荐${checkResult.remainingCount - 1}次。`);
        }

        // 确保教师数据已加载
        if (this.teachers.length === 0) {
          await this.loadTeachers();
        }        // 构建请求数据
        const requestData = {
          tags: this.selectedTags.map(tag => this.getTagLabel(tag)),
          preferences: this.userInput.trim(),
          teachers: this.teachers.map(teacher => ({
            id: teacher.id,
            name: teacher.name,
            title: teacher.title,
            research_area: teacher.research_area || teacher.researchArea,
            profile_url: teacher.profile_url || teacher.profileUrl,
            department: teacher.department,
            rank: teacher.rank
          }))
        };
          // 添加用户画像数据（仅个人描述）
        if (this.userProfile && this.userProfile.personImage) {
          requestData.userProfile = {
            personImage: this.userProfile.personImage // 仅添加用户个人描述
          };
        }

        console.log('发送到DeepSeek的请求数据:', requestData);

        // 使用fetch API处理流式响应
        fetch('/api/deepSeek/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify(requestData)
        }).then(async response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // 处理流式响应
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let result = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // 处理流式数据，按行处理
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一个可能不完整的行

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const content = line.substring(5).trim();
                if (content) {
                  result += content; // 只做累加，不做任何格式化
                }
              }
            }
          }

          // 只在最后做一次格式化
          let formattedText = result;

          // 推荐导师列表加粗
          formattedText = formattedText.replace(/推荐导师列表/g, '\n\n**推荐导师列表**\n\n');

          // 标题格式
          formattedText = formattedText.replace(/###\s*(\d+)\s*\.\s*/g, '\n\n### $1. ');

          // 列表项格式
          formattedText = formattedText.replace(/-\s+/g, '- ');

          // 确保每个标题、列表项前后有换行
          formattedText = formattedText.replace(/(### .*)/g, '\n$1\n');
          formattedText = formattedText.replace(/(- .*)/g, '$1\n');

          // 让每个导师之间有空行
          formattedText = formattedText.replace(/(\\d+\\. .+?)(?=\\d+\\. )/gs, '$1\n\n');

          // 推荐理由、研究方向、职称、所属院系后加换行
          formattedText = formattedText.replace(/推荐理由：/g, '推荐理由：\n');
          formattedText = formattedText.replace(/研究方向：/g, '研究方向：\n');
          formattedText = formattedText.replace(/职称：/g, '职称：\n');
          formattedText = formattedText.replace(/所属院系：/g, '所属院系：\n');

          // 合并多余的空行
          formattedText = formattedText.replace(/\n{3,}/g, '\n\n');

          this.recommendation = formattedText;
        }).catch(error => {
          console.error('DeepSeek API请求失败:', error);
          this.$message.error('AI推荐服务暂时不可用，将使用本地推荐');
          this.useLocalRecommend();
        }).finally(() => {
          this.isLoading = false;
        });

      } catch (error) {
        console.error('推荐处理失败:', error);
        this.$message.error(`推荐处理失败: ${error.message}`);
        this.useLocalRecommend();
        this.isLoading = false;
      }
    },

    formatRecommendation(text) {
      if (!text) return '';
      
      // 设置marked选项
      marked.setOptions({
        breaks: true,
        gfm: true
      });
      
      // 处理链接
      text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
      
      // 解析markdown
      return marked(text);
    },

    useLocalRecommend() {
      // 获取选中的标签的标签文本
      const selectedTagsText = this.selectedTags.map(tag => this.getTagLabel(tag)).join('、')

      // 根据标签和用户输入进行简单的本地推荐逻辑
      let recommendTeachers = [...this.teachers]

      // 如果选择了"科研成果多"标签，优先推荐研究方向多的老师
      if (this.selectedTags.includes('research')) {
        recommendTeachers.sort((a, b) => {
          const aResearchCount = a.research_area ? a.research_area.split(',').length : 0
          const bResearchCount = b.research_area ? b.research_area.split(',').length : 0
          return bResearchCount - aResearchCount
        })
      }

      // 如果用户有输入特定研究方向的偏好
      if (this.userInput) {
        const userPreferences = this.userInput.toLowerCase()
        recommendTeachers = recommendTeachers.filter(teacher => {
          if (!teacher.research_area) return false
          return teacher.research_area.toLowerCase().includes(userPreferences)
        })
      }

      // 生成推荐文本
      this.recommendation = `根据您选择的标签：${selectedTagsText || '无'}\n`
      this.recommendation += `以及您的输入：${this.userInput || '无'}\n\n`
      this.recommendation += `我们为您推荐以下导师：\n\n`

      if (recommendTeachers.length === 0) {
        this.recommendation += `很抱歉，没有找到符合条件的导师。请尝试其他条件。`
      } else {
        recommendTeachers.slice(0, 3).forEach((teacher, index) => {
          this.recommendation += `${index + 1}. ${teacher.name}（${teacher.title}）\n`
          this.recommendation += `   所属院系：${teacher.department}\n`
          this.recommendation += `   研究方向：${teacher.research_area || '无'}\n`
          this.recommendation += `   个人主页：${teacher.profile_url || '无'}\n\n`
        })
      }
    },    fetchUserProfile() {
      // 从本地存储中获取用户信息（包括token和用户ID）
      const userJson = localStorage.getItem('user')
      if (!userJson) {
        console.warn('用户未登录，无法获取用户画像')
        return
      }
      
      try {
        const user = JSON.parse(userJson)
        this.userId = user.id
        
        // 使用用户ID获取详细信息
        request.get(`user/${user.id}`).then(response => {
          if (response.code === 200) {
            this.userProfile = response.data
            console.log('成功获取用户画像:', this.userProfile)
          } else {
            console.warn('获取用户信息失败:', response.msg)
          }
        }).catch(error => {
          console.error('获取用户信息时发生错误:', error)
        })
      } catch (error) {
        console.error('解析用户信息失败:', error)
      }
    }
  },  created() {
    this.loadTeachers()
    this.fetchUserProfile() // 组件创建时获取用户信息
  },
  beforeUnmount() {
    // 组件卸载前的清理工作
  }
}
</script>

<template>
  <div class="recommend-container">
    <div class="header">
      <img src="@/assets/deepseek-logo.png" alt="DeepSeek" class="logo">
      <h1>AI导师推荐</h1>
    </div>

    <div class="tags-section">
      <h2>选择你期望的导师类型</h2>
      <div class="tags-container">
        <el-tag
          v-for="tag in tags"
          :key="tag.value"
          :type="selectedTags.includes(tag.value) ? 'primary' : 'info'"
          class="tag-item"
          @click="toggleTag(tag.value)"
        >
          {{ tag.label }}
        </el-tag>
      </div>
    </div>

    <div class="input-section">
      <div class="selected-tags" v-if="selectedTags.length > 0">
        <el-tag
          v-for="tag in selectedTags"
          :key="tag"
          closable
          @close="removeTag(tag)"
        >
          {{ getTagLabel(tag) }}
        </el-tag>
      </div>
      <div class="input-container">
        <el-input
          v-model="userInput"
          type="textarea"
          :rows="4"
          placeholder="请输入你的其他偏好，例如：希望导师有海外经历、希望研究方向是计算机视觉等..."
          :disabled="isLoading"
        />
        <div class="button-group">
          <el-button
            type="primary"
            :loading="isLoading"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            获取推荐
          </el-button>
        </div>
      </div>
    </div>

    <div class="recommendation-container">
      <div v-if="recommendation" class="recommendation-content">
        <div v-html="formatRecommendation(recommendation)"></div>
      </div>
      <div v-else-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>正在生成推荐结果...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recommend-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 28px;
  color: #303133;
}

.tags-section {
  margin-bottom: 30px;
}

.tags-section h2 {
  font-size: 18px;
  color: #606266;
  margin-bottom: 15px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.3s;
}

.tag-item:hover {
  transform: translateY(-2px);
}

.input-section {
  margin-bottom: 30px;
}

.selected-tags {
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.recommendation-container {
  margin-top: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recommendation-content {
  font-size: 14px;
  line-height: 1.6;
}

.recommendation-content h2 {
  color: #1890ff;
  margin-bottom: 20px;
  font-size: 18px;
}

.recommendation-content h3 {
  color: #333;
  margin: 20px 0 10px;
  font-size: 16px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.recommendation-content ul {
  list-style-type: none;
  padding-left: 0;
}

.recommendation-content li {
  margin-bottom: 8px;
  padding-left: 20px;
  position: relative;
}

.recommendation-content li:before {
  content: "•";
  color: #1890ff;
  position: absolute;
  left: 0;
}

.recommendation-content a {
  color: #1890ff;
  text-decoration: none;
}

.recommendation-content a:hover {
  text-decoration: underline;
}

.loading {
  text-align: center;
  padding: 40px 0;
}

.loading p {
  margin-top: 10px;
  color: #666;
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid rgba(24, 144, 255, 0.3);
  border-radius: 50%;
  border-top-color: #1890ff;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .recommend-container {
    padding: 15px;
  }

  .logo {
    width: 80px;
    height: 80px;
  }

  .header h1 {
    font-size: 24px;
  }

  .tags-container {
    gap: 8px;
  }
}
</style>
